import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationMetaDto } from '../../common/dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, ProductQueryDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProductDto) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      include: { subscriptions: { where: { status: 'ACTIVE' }, include: { plan: true } } },
    });

    if (!seller) {
      throw new ForbiddenException('Only registered suppliers can publish products');
    }

    const productCount = await this.prisma.product.count({
      where: { sellerProfileId: seller.id },
    });

    const activeSub = seller.subscriptions[0];
    const maxLimit = activeSub?.plan?.maxProducts ?? 50;

    if (productCount >= maxLimit) {
      throw new ForbiddenException(
        `You have reached your tier product listing limit of ${maxLimit}. Upgrade your subscription to list more.`,
      );
    }

    const slug = dto.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + `-${Date.now().toString().slice(-6)}`;

    const { images, tieredPrices, customizations, ...productData } = dto;

    return this.prisma.product.create({
      data: {
        ...productData,
        slug,
        sellerProfileId: seller.id,
        images: {
          create: images.map((img, idx) => ({
            url: img.url,
            isThumbnail: img.isThumbnail ?? idx === 0,
            sortOrder: img.sortOrder ?? idx,
          })),
        },
        tieredPrices: {
          create: tieredPrices.map((tp) => ({
            minQuantity: tp.minQuantity,
            maxQuantity: tp.maxQuantity,
            unitPrice: tp.unitPrice,
          })),
        },
        ...(customizations && customizations.length > 0
          ? {
              customizations: {
                create: customizations.map((c) => ({
                  customizationType: c.customizationType as any,
                  minMoq: c.minMoq,
                  extraCostPerUnit: c.extraCostPerUnit ?? 0,
                  description: c.description,
                })),
              },
            }
          : {}),
      },
      include: {
        images: true,
        tieredPrices: { orderBy: { minQuantity: 'asc' } },
        customizations: true,
        sellerProfile: {
          select: {
            id: true,
            companyName: true,
            storeSlug: true,
            verificationStatus: true,
            currentTier: true,
          },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        tieredPrices: { orderBy: { minQuantity: 'asc' } },
        customizations: true,
        category: true,
        sellerProfile: {
          include: {
            factoryDetail: true,
            documents: { where: { isAudited: true } },
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { reply: true, buyer: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product '${slug}' not found`);
    }

    await this.prisma.product.update({
      where: { id: product.id },
      data: { viewsCount: { increment: 1 } },
    });

    return product;
  }

  async update(userId: string, id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { sellerProfile: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerProfile.userId !== userId) {
      throw new ForbiddenException('You can only modify products from your own catalog');
    }

    const { images, tieredPrices, customizations, ...productData } = dto;

    await this.prisma.$transaction([
      this.prisma.productImage.deleteMany({ where: { productId: id } }),
      this.prisma.tieredPrice.deleteMany({ where: { productId: id } }),
      this.prisma.productCustomization.deleteMany({ where: { productId: id } }),
      this.prisma.product.update({
        where: { id },
        data: {
          ...productData,
          images: {
            create: images.map((img, idx) => ({
              url: img.url,
              isThumbnail: img.isThumbnail ?? idx === 0,
              sortOrder: img.sortOrder ?? idx,
            })),
          },
          tieredPrices: {
            create: tieredPrices.map((tp) => ({
              minQuantity: tp.minQuantity,
              maxQuantity: tp.maxQuantity,
              unitPrice: tp.unitPrice,
            })),
          },
          ...(customizations && customizations.length > 0
            ? {
                customizations: {
                  create: customizations.map((c) => ({
                    customizationType: c.customizationType as any,
                    minMoq: c.minMoq,
                    extraCostPerUnit: c.extraCostPerUnit ?? 0,
                    description: c.description,
                  })),
                },
              }
            : {}),
        },
      }),
    ]);

    return this.findBySlug(product.slug);
  }

  async delete(userId: string, id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { sellerProfile: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerProfile.userId !== userId) {
      throw new ForbiddenException('You can only delete products from your own catalog');
    }

    await this.prisma.product.delete({ where: { id } });
    return { message: 'Product removed from catalog' };
  }

  async findAll(query: ProductQueryDto) {
    const where: any = { isActive: true };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.sellerProfileId) {
      where.sellerProfileId = query.sellerProfileId;
    }
    if (query.maxMoq) {
      where.moq = { lte: query.maxMoq };
    }
    if (query.isCustomizable !== undefined) {
      where.isCustomizable = query.isCustomizable;
    }
    if (query.originCountry) {
      where.originCountry = { contains: query.originCountry, mode: 'insensitive' };
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: query.skip,
        take: query.take,
        include: {
          images: { where: { isThumbnail: true }, take: 1 },
          tieredPrices: { orderBy: { minQuantity: 'asc' } },
          sellerProfile: {
            select: {
              id: true,
              companyName: true,
              storeSlug: true,
              verificationStatus: true,
              currentTier: true,
              country: true,
            },
          },
        },
        orderBy: { createdAt: query.sortOrder || 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      meta: new PaginationMetaDto(total, query.page ?? 1, query.limit ?? 20),
    };
  }
}
