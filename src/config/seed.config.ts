import { registerAs } from '@nestjs/config';

export interface AdminSeedUser {
  name?: string;
  email?: string;
  password?: string;
}

export interface SeedConfig {
  superAdmin1: AdminSeedUser;
  superAdmin2: AdminSeedUser;
}

export const seedConfig = registerAs('seed', (): SeedConfig => ({
  superAdmin1: {
    name: process.env.SUPER_ADMIN_1_NAME,
    email: process.env.SUPER_ADMIN_1_EMAIL,
    password: process.env.SUPER_ADMIN_1_PASSWORD,
  },
  superAdmin2: {
    name: process.env.SUPER_ADMIN_2_NAME,
    email: process.env.SUPER_ADMIN_2_EMAIL,
    password: process.env.SUPER_ADMIN_2_PASSWORD,
  },
}));
