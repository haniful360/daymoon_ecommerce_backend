import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedSuperAdmins } from './super-admin.seed';
import { seedSubscriptionPlans } from './subscription-plan.seed';


const connectionString = process.env.DATABASE_URL as string;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 ========================================================');
  console.log('🌱 Starting Daymoon B2B Marketplace Database Seeding');
  console.log('🌱 ========================================================');

  // 1. Seed Super Admin Users
  await seedSuperAdmins(prisma);

  // 2. Seed Subscription Plans with rich B2B Features
  await seedSubscriptionPlans(prisma);

  console.log('🎉 ========================================================');
  console.log('🎉 Database seeding completed successfully!');
  console.log('🎉 ========================================================');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
