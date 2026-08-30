import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { MembershipTier } from '../../common/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanDto, CreateSubscriptionDto, SubscriptionQueryDto, UpdateSubscriptionDto } from './dto';
import { PaginationMetaDto } from '../../common/dto';

@Injectable()
export class SubscriptionsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultPlans();
  }

  private async seedDefaultPlans() {
    const plans = [
      {
        tier: MembershipTier.BASIC,
        name: 'Basic Supplier Tier',
        priceMonthly: 119.99,
        priceAnnually: 1199.99,
        maxProducts: 50,
        maxMonthlyQuotes: 20,
        verifiedBadge: false,
        priorityRanking: false,
        dedicatedSupport: false,
        description: 'Ideal for small suppliers and factories entering global export.',
      },
      {
        tier: MembershipTier.STANDARD,
        name: 'Standard Gold Supplier Tier',
        priceMonthly: 299.99,
        priceAnnually: 2999.99,
        maxProducts: 250,
        maxMonthlyQuotes: 100,
        verifiedBadge: true,
        priorityRanking: true,
        dedicatedSupport: false,
        description: 'For established manufacturers seeking verified trust badge and higher RFQ volume.',
      },
      {
        tier: MembershipTier.PREMIUM,
        name: 'Premium Verified Factory Tier',
        priceMonthly: 599.99,
        priceAnnually: 5999.99,
        maxProducts: 999999,
        maxMonthlyQuotes: 999999,
        verifiedBadge: true,
        priorityRanking: true,
        dedicatedSupport: true,
        description: 'Full enterprise visibility, unlimited product catalog, unlimited quotes, and dedicated sourcing account manager.',
      },
    ];

    for (const plan of plans) {
      await this.prisma.subscriptionPlan.upsert({
        where: { tier: plan.tier as any },
        create: plan as any,
        update: {
          priceMonthly: plan.priceMonthly,
          maxProducts: plan.maxProducts,
          maxMonthlyQuotes: plan.maxMonthlyQuotes,
        },
      });
    }
  }

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });
  }

  async getMySubscription(userId: string) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: { sellerProfileId: seller.id },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      currentTier: seller.currentTier,
      subscriptionExpiresAt: seller.subscriptionExpiresAt,
      activeSubscription: subscription,
    };
  }

  async subscribe(userId: string, dto: CreateSubscriptionDto) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { tier: dto.tier as any },
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan '${dto.tier}' not found`);
    }

    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const [subscription] = await this.prisma.$transaction([
      this.prisma.subscription.create({
        data: {
          sellerProfileId: seller.id,
          planId: plan.id,
          status: 'ACTIVE',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          paymentReference: dto.paymentMethodId || `sub_manual_${Date.now()}`,
        },
        include: { plan: true },
      }),
      this.prisma.sellerProfile.update({
        where: { id: seller.id },
        data: {
          currentTier: dto.tier as any,
          subscriptionExpiresAt: periodEnd,
        },
      }),
      this.prisma.financialLedger.create({
        data: {
          transactionType: 'SUBSCRIPTION_FEE',
          amount: plan.priceMonthly,
          currency: 'USD',
          referenceType: 'SUBSCRIPTION',
          referenceId: seller.id,
          balanceAfter: 0,
          note: `Monthly recurring subscription fee for tier ${dto.tier}`,
        },
      }),
    ]);

    return subscription;
  }

  async cancelSubscription(userId: string) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    const activeSub = await this.prisma.subscription.findFirst({
      where: { sellerProfileId: seller.id, status: 'ACTIVE' },
    });

    if (!activeSub) {
      throw new BadRequestException('No active subscription to cancel');
    }

    return this.prisma.subscription.update({
      where: { id: activeSub.id },
      data: { cancelAtPeriodEnd: true },
    });
  }

  async findAll(query: SubscriptionQueryDto) {
    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip: query.skip,
        take: query.take,
        include: {
          plan: true,
          sellerProfile: { select: { id: true, companyName: true, storeSlug: true } },
        },
        orderBy: { createdAt: query.sortOrder || 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      items,
      meta: new PaginationMetaDto(total, query.page ?? 1, query.limit ?? 20),
    };
  }
}
