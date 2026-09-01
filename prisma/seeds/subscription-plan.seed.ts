import { PrismaClient, RfqPriorityLevel, AnalyticsTier } from '@prisma/client';

export async function seedSubscriptionPlans(prisma: PrismaClient): Promise<void> {
  console.log('💎 Seeding Supplier Subscription Plans with features...');

  const plans = [
    {
      planCode: 'FREE_SELLER',
      name: 'Free Supplier Tier',
      monthlyPrice: 0.0,
      annualPrice: 0.0,
      productLimit: 10,
      hasBadge: false,
      rfqPriority: RfqPriorityLevel.NORMAL,
      analyticsAccess: AnalyticsTier.NONE,
      commissionRate: 15.0,
      features: [
        'List up to 10 wholesale products',
        'Standard marketplace search visibility',
        'Receive public buyer inquiries',
        '15% platform transaction commission',
        'Community email support',
      ],
    },
    {
      planCode: 'BASIC_VERIFIED',
      name: 'Basic Verified Supplier',
      monthlyPrice: 119.99,
      annualPrice: 1199.99,
      productLimit: 50,
      hasBadge: true,
      rfqPriority: RfqPriorityLevel.NORMAL,
      analyticsAccess: AnalyticsTier.BASIC,
      commissionRate: 10.0,
      features: [
        'List up to 50 wholesale products',
        'Verified Supplier Trust Badge on storefront',
        'Standard RFQ quotation bidding access',
        'Basic store traffic & viewer analytics',
        '10% platform transaction commission',
        'Factory license & ISO certificate verification',
        'Standard email & ticket support (48h response)',
      ],
    },
    {
      planCode: 'STANDARD_VERIFIED',
      name: 'Standard Factory Exporter',
      monthlyPrice: 299.99,
      annualPrice: 2999.99,
      productLimit: 150,
      hasBadge: true,
      rfqPriority: RfqPriorityLevel.HIGH,
      analyticsAccess: AnalyticsTier.BASIC,
      commissionRate: 7.0,
      features: [
        'List up to 150 wholesale products',
        'Verified Factory & Audited Supplier Badge',
        'High RFQ quotation priority with early buyer access',
        'Multi-tiered volume pricing & MOQ configurations',
        '7% platform transaction commission',
        'OEM / ODM custom design request handling',
        'Dedicated ticket & chat support (24h response)',
      ],
    },
    {
      planCode: 'PREMIUM_VERIFIED',
      name: 'Premium Enterprise Manufacturer',
      monthlyPrice: 599.99,
      annualPrice: 5999.99,
      productLimit: -1, // Unlimited
      hasBadge: true,
      rfqPriority: RfqPriorityLevel.EXCLUSIVE,
      analyticsAccess: AnalyticsTier.FULL,
      commissionRate: 4.0,
      features: [
        'Unlimited wholesale product listings',
        'Top marketplace search ranking & homepage showcase',
        'Exclusive high-budget RFQ direct buyer matching',
        'Full enterprise analytics suite & exportable sales reports',
        '4% lowest platform transaction commission',
        'Custom storefront branding & 3D/video factory tour',
        'Trade Assurance priority escrow protection',
        '24/7 dedicated key account manager & phone support',
      ],
    },
  ];

  for (const plan of plans) {
    const seeded = await prisma.subscriptionPlan.upsert({
      where: { planCode: plan.planCode },
      update: {
        name: plan.name,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        productLimit: plan.productLimit,
        hasBadge: plan.hasBadge,
        rfqPriority: plan.rfqPriority,
        analyticsAccess: plan.analyticsAccess,
        commissionRate: plan.commissionRate,
        features: plan.features,
      },
      create: {
        planCode: plan.planCode,
        name: plan.name,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        productLimit: plan.productLimit,
        hasBadge: plan.hasBadge,
        rfqPriority: plan.rfqPriority,
        analyticsAccess: plan.analyticsAccess,
        commissionRate: plan.commissionRate,
        features: plan.features,
      },
    });
    console.log(`  ✅ Plan [${seeded.planCode}]: ${seeded.name} ($${seeded.monthlyPrice}/mo) - ${plan.features.length} features`);
  }
}

