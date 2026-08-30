import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationMetaDto } from '../../common/dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto, ReplyReviewDto, ReviewQueryDto } from './dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(buyerId: string, dto: CreateReviewDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('You can only review orders you placed');
    }

    const hasItem = order.items.some((i) => i.productId === dto.productId);
    if (!hasItem) {
      throw new BadRequestException('Product was not part of this order');
    }

    const existing = await this.prisma.review.findFirst({
      where: { orderId: dto.orderId, productId: dto.productId, buyerId },
    });

    if (existing) {
      throw new BadRequestException('You have already reviewed this product for this order');
    }

    const review = await this.prisma.review.create({
      data: {
        orderId: dto.orderId,
        productId: dto.productId,
        sellerProfileId: order.sellerProfileId,
        buyerId,
        productRating: dto.productRating,
        supplierRating: dto.supplierRating,
        communicationRating: dto.communicationRating,
        punctualityRating: dto.punctualityRating,
        comment: dto.comment,
        mediaUrls: dto.mediaUrls ? (dto.mediaUrls as any) : undefined,
        isVerifiedPurchase: true,
      },
    });

    const aggregate = await this.prisma.review.aggregate({
      where: { productId: dto.productId },
      _avg: { productRating: true },
      _count: { id: true },
    });

    await this.prisma.product.update({
      where: { id: dto.productId },
      data: {
        ratingAvg: aggregate._avg.productRating || 0,
        ratingCount: aggregate._count.id || 0,
      },
    });

    return review;
  }

  async reply(userId: string, reviewId: string, dto: ReplyReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { sellerProfile: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.sellerProfile.userId !== userId) {
      throw new ForbiddenException('You can only reply to reviews on your own storefront');
    }

    return this.prisma.reviewReply.upsert({
      where: { reviewId },
      create: {
        reviewId,
        sellerProfileId: review.sellerProfileId,
        replyText: dto.replyText,
      },
      update: {
        replyText: dto.replyText,
      },
    });
  }

  async findAll(query: ReviewQueryDto) {
    const where: any = {};
    if (query.productId) {
      where.productId = query.productId;
    }
    if (query.sellerProfileId) {
      where.sellerProfileId = query.sellerProfileId;
    }

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: query.skip,
        take: query.take,
        include: {
          buyer: { select: { firstName: true, lastName: true } },
          reply: true,
        },
        orderBy: { createdAt: query.sortOrder || 'desc' },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items,
      meta: new PaginationMetaDto(total, query.page ?? 1, query.limit ?? 20),
    };
  }
}
