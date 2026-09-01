import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedSuperAdmins(prisma: PrismaClient): Promise<void> {
  console.log('👤 Seeding Super Admin accounts...');

  const admin1Email = process.env.SUPER_ADMIN_1_EMAIL as string;
  const admin1Password = process.env.SUPER_ADMIN_1_PASSWORD as string;
  const admin1Name = process.env.SUPER_ADMIN_1_NAME as string;

  const admin2Email = process.env.SUPER_ADMIN_2_EMAIL as string;
  const admin2Password = process.env.SUPER_ADMIN_2_PASSWORD as string;
  const admin2Name = process.env.SUPER_ADMIN_2_NAME as string;

  const saltRounds = 10;
  const hash1 = await bcrypt.hash(admin1Password, saltRounds);
  const hash2 = await bcrypt.hash(admin2Password, saltRounds);

  // 1. Upsert Super Admin 1
  const superAdmin1 = await prisma.user.upsert({
    where: { email: admin1Email.toLowerCase() },
    update: {
      name: admin1Name,
      passwordHash: hash1,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: admin1Email.toLowerCase(),
      name: admin1Name,
      passwordHash: hash1,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`  ✅ Super Admin 1: ${superAdmin1.name} (${superAdmin1.email})`);

  // 2. Upsert Super Admin 2
  const superAdmin2 = await prisma.user.upsert({
    where: { email: admin2Email.toLowerCase() },
    update: {
      name: admin2Name,
      passwordHash: hash2,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: admin2Email.toLowerCase(),
      name: admin2Name,
      passwordHash: hash2,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`  ✅ Super Admin 2: ${superAdmin2.name} (${superAdmin2.email})`);
}
