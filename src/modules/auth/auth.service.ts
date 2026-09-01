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
import { ChangePasswordDto, LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { sellerProfile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Your account has been suspended. Please contact support.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
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

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
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
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') as any,
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
