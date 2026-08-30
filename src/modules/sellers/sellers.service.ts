import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationMetaDto } from '../../common/dto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OnboardingStep1Dto,
  OnboardingStep2Dto,
  OnboardingStep3Dto,
  OnboardingStep4Dto,
  OnboardingStep5Dto,
  SellerQueryDto,
  UpdateSellerProfileDto,
} from './dto';

@Injectable()
export class SellersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        factoryDetail: true,
        documents: true,
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile does not exist for this account');
    }

    return profile;
  }

  async getProfileBySlug(slug: string) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { storeSlug: slug },
      include: {
        factoryDetail: true,
        documents: {
          where: { isAudited: true },
          select: {
            id: true,
            documentType: true,
            documentName: true,
            issueDate: true,
            expiryDate: true,
            verifiedAt: true,
          },
        },
        products: {
          where: { isActive: true },
          include: { images: true, tieredPrices: true },
          take: 12,
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { reply: true },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Supplier profile '${slug}' not found`);
    }

    return profile;
  }

  async saveOnboardingStep1(userId: string, dto: OnboardingStep1Dto) {
    const profile = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    const storeSlug = dto.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + `-${profile.id.slice(0, 4)}`;

    return this.prisma.sellerProfile.update({
      where: { userId },
      data: {
        ...dto,
        storeSlug,
        onboardingStep: Math.max(profile.onboardingStep, 2),
      },
    });
  }

  async saveOnboardingStep2(userId: string, dto: OnboardingStep2Dto) {
    const profile = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    for (const doc of dto.documents) {
      await this.prisma.sellerDocument.create({
        data: {
          sellerProfileId: profile.id,
          documentType: doc.documentType,
          documentName: doc.documentName,
          documentNumber: doc.documentNumber,
          fileUrl: doc.fileUrl,
          issueDate: doc.issueDate ? new Date(doc.issueDate) : null,
          expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : null,
        },
      });
    }

    return this.prisma.sellerProfile.update({
      where: { userId },
      data: {
        onboardingStep: Math.max(profile.onboardingStep, 3),
      },
      include: { documents: true },
    });
  }

  async saveOnboardingStep3(userId: string, dto: OnboardingStep3Dto) {
    const profile = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    const factoryDetail = await this.prisma.factoryDetail.upsert({
      where: { sellerProfileId: profile.id },
      create: {
        ...dto,
        sellerProfileId: profile.id,
      },
      update: dto,
    });

    const updatedProfile = await this.prisma.sellerProfile.update({
      where: { userId },
      data: {
        onboardingStep: Math.max(profile.onboardingStep, 4),
      },
    });

    return { profile: updatedProfile, factoryDetail };
  }

  async saveOnboardingStep4(userId: string, dto: OnboardingStep4Dto) {
    const profile = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    for (const cert of dto.certifications) {
      await this.prisma.sellerDocument.create({
        data: {
          sellerProfileId: profile.id,
          documentType: cert.documentType,
          documentName: cert.documentName,
          documentNumber: cert.documentNumber,
          fileUrl: cert.fileUrl,
          issueDate: cert.issueDate ? new Date(cert.issueDate) : null,
          expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : null,
        },
      });
    }

    return this.prisma.sellerProfile.update({
      where: { userId },
      data: {
        onboardingStep: Math.max(profile.onboardingStep, 5),
      },
      include: { documents: true },
    });
  }

  async saveOnboardingStep5(userId: string, dto: OnboardingStep5Dto) {
    const profile = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    return this.prisma.sellerProfile.update({
      where: { userId },
      data: {
        onboardingStep: 5,
        isOnboardingComplete: true,
        verificationStatus: 'PENDING',
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateSellerProfileDto) {
    return this.prisma.sellerProfile.update({
      where: { userId },
      data: dto,
    });
  }

  async findAll(query: SellerQueryDto) {
    const where: any = {
      isOnboardingComplete: true,
    };

    if (query.verificationStatus) {
      where.verificationStatus = query.verificationStatus;
    }
    if (query.country) {
      where.country = { contains: query.country, mode: 'insensitive' };
    }
    if (query.search) {
      where.OR = [
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { businessDescription: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.sellerProfile.findMany({
        where,
        skip: query.skip,
        take: query.take,
        include: {
          factoryDetail: true,
        },
        orderBy: { createdAt: query.sortOrder || 'desc' },
      }),
      this.prisma.sellerProfile.count({ where }),
    ]);

    return {
      items,
      meta: new PaginationMetaDto(total, query.page ?? 1, query.limit ?? 20),
    };
  }
}
