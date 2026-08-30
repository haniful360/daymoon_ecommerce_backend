import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationMetaDto } from '../../common/dto';
import { PayoutStatus, UserRole } from '../../common/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { PayoutQueryDto, ProcessPayoutDto, RequestPayoutDto } from './dto';

@Injectable()
export class PayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSellerBalance(userId: string) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    const deliveredOrders = await this.prisma.order.aggregate({
      where: {
        sellerProfileId: seller.id,
        orderStatus: 'DELIVERED',
      },
      _sum: { sellerNetAmount: true },
    });

    const totalEarned = Number(deliveredOrders._sum.sellerNetAmount || 0);

    const payouts = await this.prisma.payoutRequest.aggregate({
      where: {
        sellerProfileId: seller.id,
        status: { in: ['REQUESTED', 'PROCESSING', 'COMPLETED'] },
      },
      _sum: { amount: true },
    });

    const totalWithdrawnOrPending = Number(payouts._sum.amount || 0);
    const availableBalance = Number((totalEarned - totalWithdrawnOrPending).toFixed(2));

    return {
      totalEarned,
      totalWithdrawnOrPending,
      availableBalance: Math.max(0, availableBalance),
    };
  }

  async requestPayout(userId: string, dto: RequestPayoutDto) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    const { availableBalance } = await this.getSellerBalance(userId);

    if (dto.amount > availableBalance) {
      throw new BadRequestException(
        `Requested withdrawal amount ($${dto.amount}) exceeds available balance ($${availableBalance})`,
      );
    }

    const payout = await this.prisma.payoutRequest.create({
      data: {
        sellerProfileId: seller.id,
        amount: dto.amount,
        currency: 'USD',
        payoutMethod: dto.payoutMethod as any,
        payoutAccountDetails: dto.payoutAccountDetails,
        status: 'REQUESTED',
      },
    });

    return payout;
  }

  async processPayout(payoutId: string, dto: ProcessPayoutDto) {
    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('Payout request not found');
    }

    if (payout.status === 'COMPLETED' || payout.status === 'REJECTED') {
      throw new BadRequestException('Payout request has already been finalized');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: dto.status as any,
          transactionReference: dto.transactionReference,
          adminNote: dto.adminNote,
          processedAt: new Date(),
        },
      }),
      ...(dto.status === PayoutStatus.COMPLETED
        ? [
            this.prisma.financialLedger.create({
              data: {
                transactionType: 'PAYOUT_DISBURSEMENT',
                amount: payout.amount,
                currency: payout.currency,
                referenceType: 'PAYOUT_REQUEST',
                referenceId: payout.id,
                balanceAfter: 0,
                note: `Payout disbursement ${dto.transactionReference || ''} for seller ${payout.sellerProfileId}`,
              },
            }),
          ]
        : []),
    ]);

    return updated;
  }

  async findAll(userId: string, role: UserRole, query: PayoutQueryDto) {
    const where: any = {};

    if (role === UserRole.SELLER) {
      const seller = await this.prisma.sellerProfile.findUnique({ where: { userId } });
      if (!seller) return { items: [], meta: new PaginationMetaDto(0, 1, 20) };
      where.sellerProfileId = seller.id;
    } else if (query.sellerProfileId) {
      where.sellerProfileId = query.sellerProfileId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.payoutRequest.findMany({
        where,
        skip: query.skip,
        take: query.take,
        include: {
          sellerProfile: { select: { id: true, companyName: true, storeSlug: true } },
        },
        orderBy: { requestedAt: query.sortOrder || 'desc' },
      }),
      this.prisma.payoutRequest.count({ where }),
    ]);

    return {
      items,
      meta: new PaginationMetaDto(total, query.page ?? 1, query.limit ?? 20),
    };
  }
}
