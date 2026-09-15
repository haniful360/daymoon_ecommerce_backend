import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../common/enums';
import type { JwtPayload } from '../../common/interfaces';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../redis/redis.service';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterBuyerDto,
  RegisterDto,
  SendOtpDto,
} from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    if (dto.role === UserRole.SELLER && !dto.bankDetails) {
      throw new BadRequestException(
        'Bank details (bankName, accountHolderName, accountNumber, swiftCode) are mandatory for seller registration.',
      );
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        role: dto.role,
        ...(dto.role === UserRole.SELLER
          ? {
              sellerProfile: {
                create: {
                  businessName: dto.businessName ?? `${dto.name}'s Enterprise`,
                  businessType: dto.businessType ?? 'Manufacturer & Exporter',
                  country: dto.country ?? 'Global',
                  bankDetails: dto.bankDetails as any,
                  businessDescription: 'Pending seller profile completion.',
                },
              },
            }
          : {}),
      },
      include: {
        sellerProfile: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        sellerProfileId: user.sellerProfile?.id,
      },
      ...tokens,
    };
  }

  /**
   * Send 6-digit verification OTP to Buyer's email stored in Redis (5 min TTL)
   */
  async sendBuyerOtp(dto: SendOtpDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.status === 'ACTIVE') {
      throw new ConflictException(
        'An account with this email already exists. Please login.',
      );
    }

    // Rate-limiting: prevent spamming resend OTP within 60 seconds
    const cooldownKey = `otp_cooldown:${normalizedEmail}`;
    const isCoolingDown = await this.redisService.exists(cooldownKey);
    if (isCoolingDown) {
      throw new BadRequestException(
        'Please wait 60 seconds before requesting a new OTP.',
      );
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis with 300 seconds (5 mins) TTL
    const otpKey = `otp:buyer:${normalizedEmail}`;
    await this.redisService.set(otpKey, otp, 300);
    // Set 60-second cooldown
    await this.redisService.set(cooldownKey, '1', 60);

    // Send email using Handlebars template
    await this.mailService.sendOtpEmail({
      to: normalizedEmail,
      name: dto.name?.trim() || 'Valued Buyer',
      otp,
      expiresInMinutes: 5,
    });

    return {
      success: true,
      message: 'Verification OTP has been sent to your email address.',
      expiresIn: 300,
    };
  }

  /**
   * Complete Buyer Registration after verifying OTP from Redis
   */
  async registerBuyer(dto: RegisterBuyerDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // 1. Verify OTP from Redis
    const otpKey = `otp:buyer:${normalizedEmail}`;
    const storedOtp = await this.redisService.get(otpKey);

    if (!storedOtp) {
      throw new BadRequestException(
        'Verification OTP has expired or is invalid. Please request a new OTP.',
      );
    }

    if (storedOtp !== dto.otp.trim()) {
      throw new BadRequestException(
        'Invalid verification code. Please check your email and try again.',
      );
    }

    // 2. Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.status === 'ACTIVE') {
      throw new ConflictException(
        'An account with this email already exists. Please login.',
      );
    }

    // 3. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // 4. Create or update user as verified BUYER
    let user;
    if (existingUser) {
      user = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: dto.name.trim(),
          passwordHash,
          phone: dto.phone?.trim() ?? null,
          role: UserRole.BUYER,
          status: 'ACTIVE',
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email: normalizedEmail,
          passwordHash,
          phone: dto.phone?.trim() ?? null,
          role: UserRole.BUYER,
          status: 'ACTIVE',
        },
      });
    }

    // 5. Clean up Redis OTP
    await this.redisService.del(otpKey);
    await this.redisService.del(`otp_cooldown:${normalizedEmail}`);

    // 6. Generate JWT tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      message: 'Buyer account registered and verified successfully.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { sellerProfile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact support.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        sellerProfileId: user.sellerProfile?.id,
      },
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') as string,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { sellerProfile: true },
      });

      if (!user || user.status === 'SUSPENDED') {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new BadRequestException('Current password does not match');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password updated successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        sellerProfile: {
          select: {
            id: true,
            businessName: true,
            businessType: true,
            country: true,
            bankDetails: true,
            isVerified: true,
            averageRating: true,
            totalReviews: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User profile not found');
    }

    return user;
  }

  private async generateTokens(userId: string, email: string, role: UserRole) {
    const payload: JwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET') as string,
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') as string,
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
        ) as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 86400,
    };
  }
}
