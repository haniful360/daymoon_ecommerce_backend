import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationMetaDto } from '../../common/dto';
import { VerificationStatus } from '../../common/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerQueryDto, UpdateCommissionRateDto, VerifySellerDto } from './dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardAnalytics() {
    const [
      totalUsers,
      totalBuyers,
      totalSellers,
      verifiedSellers,
      pendingVerifications,
      totalOrders,
      financialAggregates,
      subscriptionRevenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'BUYER' } }),
      this.prisma.sellerProfile.count(),
      this.prisma.sellerProfile.count({ where: { verificationStatus: 'APPROVED' } }),
      this.prisma.sellerProfile.count({ where: { verificationStatus: 'PENDING' } }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        where: { orderStatus: { not: 'CANCELLED' } },
        _sum: {
          totalAmount: true,
          commissionAmount: true,
        },
      }),
      this.prisma.financialLedger.aggregate({
        where: { transactionType: 'SUBSCRIPTION_FEE' },
        _sum: { amount: true },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        buyers: totalBuyers,
        sellers: totalSellers,
        verifiedSellers,
        pendingVerificationQueue: pendingVerifications,
      },
      orders: {
        totalCount: totalOrders,
        grossMerchandiseValueGMV: Number(financialAggregates._sum.totalAmount || 0),
      },
      finances: {
        totalOrderCommissionEarned: Number(financialAggregates._sum.commissionAmount || 0),
        totalSubscriptionRevenue: Number(subscriptionRevenue._sum.amount || 0),
        netPlatformRevenue: Number(
          (
            Number(financialAggregates._sum.commissionAmount || 0) +
            Number(subscriptionRevenue._sum.amount || 0)
          ).toFixed(2),
        ),
      },
    };
  }

  async auditSeller(sellerProfileId: string, dto: VerifySellerDto) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { id: sellerProfileId },
      include: { documents: true },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    const isApproved = dto.status === VerificationStatus.APPROVED;

    return this.prisma.$transaction(async (tx) => {
      if (dto.verifiedDocumentIds && dto.verifiedDocumentIds.length > 0) {
        await tx.sellerDocument.updateMany({
          where: {
            id: { in: dto.verifiedDocumentIds },
            sellerProfileId,
          },
          data: {
            isAudited: true,
            verifiedAt: new Date(),
            auditNotes: dto.auditNotes,
          },
        });
      }

      const updated = await tx.sellerProfile.update({
        where: { id: sellerProfileId },
        data: {
          verificationStatus: dto.status as any,
          rejectionReason: isApproved ? null : dto.auditNotes,
          verifiedAt: isApproved ? new Date() : null,
        },
        include: {
          documents: true,
          factoryDetail: true,
        },
      });

      return updated;
    });
  }

  async getFinancialLedger(query: LedgerQueryDto) {
    const where: any = {};
    if (query.transactionType) {
      where.transactionType = query.transactionType;
    }

    const [items, total] = await Promise.all([
      this.prisma.financialLedger.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: query.sortOrder || 'desc' },
      }),
      this.prisma.financialLedger.count({ where }),
    ]);

    return {
      items,
      meta: new PaginationMetaDto(total, query.page ?? 1, query.limit ?? 20),
    };
  }

  async setCommissionSetting(dto: UpdateCommissionRateDto) {
    return this.prisma.commissionSetting.create({
      data: {
        categoryId: dto.categoryId,
        sellerTier: dto.sellerTier as any,
        commissionRatePercent: dto.commissionRatePercent,
      },
    });
  }

  async getCommissionSettings() {
    return this.prisma.commissionSetting.findMany({
      include: { category: { select: { id: true, name: true } } },
    });
  }
}
