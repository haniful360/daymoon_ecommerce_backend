import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { JwtPayload } from '../../common/interfaces';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { RegisterSellerDto, UpdateSellerProfileDto } from './dto';
import 'multer';

export interface SellerUploadedFiles {
  storeLogo?: Express.Multer.File[];
  storeBanner?: Express.Multer.File[];
  verificationDocuments?: Express.Multer.File[];
}

@Injectable()
export class SellerService {
  private readonly logger = new Logger(SellerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new Seller with multipart/form-data support
   */
  async register(dto: RegisterSellerDto, files?: SellerUploadedFiles) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // 1. Check if user email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    // 2. Check if business name is already registered
    const existingBusiness = await this.prisma.sellerProfile.findFirst({
      where: {
        businessName: {
          equals: dto.businessName.trim(),
          mode: 'insensitive',
        },
      },
    });
    if (existingBusiness) {
      throw new ConflictException(
        `Business name '${dto.businessName}' is already registered. Please choose another name.`,
      );
    }

    // 3. Validate mandatory bank details
    if (
      !dto.bankDetails ||
      !dto.bankDetails.bankName ||
      !dto.bankDetails.accountNumber
    ) {
      throw new BadRequestException(
        'Bank details (bankName, accountHolderName, accountNumber, swiftCode) are mandatory for seller payouts.',
      );
    }

    // 4. Handle file uploads (Cloudinary CDN or local storage fallback)
    let storeLogoUrl: string | null = null;
    let storeBannerUrl: string | null = null;
    let verificationDocumentsData: any[] = [];

    if (files?.storeLogo && files.storeLogo.length > 0) {
      const upload = await this.uploadService.uploadFile(
        files.storeLogo[0],
        'sellers/logos',
      );
      storeLogoUrl = upload.url;
    }

    if (files?.storeBanner && files.storeBanner.length > 0) {
      const upload = await this.uploadService.uploadFile(
        files.storeBanner[0],
        'sellers/banners',
      );
      storeBannerUrl = upload.url;
    }

    if (
      files?.verificationDocuments &&
      files.verificationDocuments.length > 0
    ) {
      const uploads = await this.uploadService.uploadMultipleFiles(
        files.verificationDocuments,
        'sellers/documents',
      );
      verificationDocumentsData = uploads.map((u) => ({
        url: u.url,
        fileName: u.originalName,
        bytes: u.bytes,
        uploadedAt: new Date().toISOString(),
      }));
    }

    // 5. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // 6. Execute atomic transaction to create User + SellerProfile
    const result = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: dto.name.trim(),
          email: normalizedEmail,
          passwordHash,
          phone: dto.phone?.trim() ?? null,
          role: UserRole.SELLER,
          status: UserStatus.ACTIVE,
        },
      });

      const newSellerProfile = await tx.sellerProfile.create({
        data: {
          userId: newUser.id,
          businessName: dto.businessName.trim(),
          businessType: dto.businessType.trim(),
          businessDescription: dto.businessDescription?.trim() ?? null,
          country: dto.country.trim(),
          taxId: dto.taxId?.trim() ?? null,
          yearsInBusiness: dto.yearsInBusiness ?? 1,
          factorySize: dto.factorySize?.trim() ?? null,
          rdStaffCount: dto.rdStaffCount?.trim() ?? null,
          returnPolicy: dto.returnPolicy?.trim() ?? '7 Days',
          shippingRegions: dto.shippingRegions ?? ['NATIONAL'],
          tradeTerms: dto.tradeTerms ?? ['FOB', 'EXW'],
          socialLinks: dto.socialLinks ?? {},
          bankDetails: dto.bankDetails as any,
          storeLogo: storeLogoUrl,
          storeBanner: storeBannerUrl,
          verificationDocuments: verificationDocumentsData,
          isVerified: false, // Pending verification by Super Admin
        },
      });

      return { user: newUser, sellerProfile: newSellerProfile };
    });

    // 7. Generate JWT access & refresh tokens
    const tokens = await this.generateTokens(
      result.user.id,
      result.user.email,
      result.user.role,
    );

    this.logger.log(
      `Seller registered successfully: ${result.sellerProfile.businessName} (User: ${result.user.email})`,
    );

    return {
      message: 'Seller account and business profile registered successfully.',
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        status: result.user.status,
      },
      sellerProfile: result.sellerProfile,
      ...tokens,
    };
  }

  /**
   * Get the logged-in seller's profile
   */
  async getMyProfile(userId: string) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found for this user');
    }

    return profile;
  }

  /**
   * Public seller store profile for buyers & marketplace
   */
  async getPublicProfile(sellerProfileId: string) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { id: sellerProfileId },
      include: {
        user: {
          select: {
            name: true,
            createdAt: true,
          },
        },
        products: {
          where: { status: 'PUBLISHED' },
          take: 10,
          select: {
            id: true,
            title: true,
            slug: true,
            moq: true,
            samplePrice: true,
            images: true,
            tieredPricings: {
              select: {
                minQuantity: true,
                maxQuantity: true,
                unitPrice: true,
              },
            },
          },
        },
        _count: {
          select: {
            products: true,
            reviews: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    // Mask sensitive bank details from public output
    const { bankDetails, taxId, ...publicProfile } = profile;
    return publicProfile;
  }

  /**
   * Update seller profile
   */
  async updateProfile(
    userId: string,
    dto: UpdateSellerProfileDto,
    files?: SellerUploadedFiles,
  ) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    let storeLogoUrl = profile.storeLogo;
    let storeBannerUrl = profile.storeBanner;
    let verificationDocs = (profile.verificationDocuments as any[]) || [];

    if (files?.storeLogo && files.storeLogo.length > 0) {
      const upload = await this.uploadService.uploadFile(
        files.storeLogo[0],
        'sellers/logos',
      );
      storeLogoUrl = upload.url;
    }

    if (files?.storeBanner && files.storeBanner.length > 0) {
      const upload = await this.uploadService.uploadFile(
        files.storeBanner[0],
        'sellers/banners',
      );
      storeBannerUrl = upload.url;
    }

    if (
      files?.verificationDocuments &&
      files.verificationDocuments.length > 0
    ) {
      const uploads = await this.uploadService.uploadMultipleFiles(
        files.verificationDocuments,
        'sellers/documents',
      );
      const newDocs = uploads.map((u) => ({
        url: u.url,
        fileName: u.originalName,
        bytes: u.bytes,
        uploadedAt: new Date().toISOString(),
      }));
      verificationDocs = [...verificationDocs, ...newDocs];
    }

    const updated = await this.prisma.sellerProfile.update({
      where: { userId },
      data: {
        ...(dto.businessName && { businessName: dto.businessName.trim() }),
        ...(dto.businessType && { businessType: dto.businessType.trim() }),
        ...(dto.businessDescription !== undefined && {
          businessDescription: dto.businessDescription,
        }),
        ...(dto.country && { country: dto.country.trim() }),
        ...(dto.taxId !== undefined && { taxId: dto.taxId }),
        ...(dto.yearsInBusiness !== undefined && {
          yearsInBusiness: dto.yearsInBusiness,
        }),
        ...(dto.factorySize !== undefined && { factorySize: dto.factorySize }),
        ...(dto.rdStaffCount !== undefined && {
          rdStaffCount: dto.rdStaffCount,
        }),
        ...(dto.returnPolicy && { returnPolicy: dto.returnPolicy }),
        ...(dto.shippingRegions && { shippingRegions: dto.shippingRegions }),
        ...(dto.tradeTerms && { tradeTerms: dto.tradeTerms }),
        ...(dto.socialLinks && { socialLinks: dto.socialLinks }),
        ...(dto.bankDetails && { bankDetails: dto.bankDetails as any }),
        storeLogo: storeLogoUrl,
        storeBanner: storeBannerUrl,
        verificationDocuments: verificationDocs,
      },
    });

    return updated;
  }

  /**
   * List verified sellers for wholesale marketplace directory
   */
  async listVerifiedSellers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [sellers, total] = await Promise.all([
      this.prisma.sellerProfile.findMany({
        where: { isVerified: true },
        skip,
        take: limit,
        select: {
          id: true,
          businessName: true,
          businessType: true,
          country: true,
          storeLogo: true,
          storeBanner: true,
          averageRating: true,
          totalReviews: true,
          yearsInBusiness: true,
          factorySize: true,
          tradeTerms: true,
        },
        orderBy: { averageRating: 'desc' },
      }),
      this.prisma.sellerProfile.count({ where: { isVerified: true } }),
    ]);

    return {
      items: sellers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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
