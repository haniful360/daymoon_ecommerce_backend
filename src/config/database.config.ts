import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  url?: string;
  port?: number;
}

export const databaseConfig = registerAs(
  'database',
  (): DatabaseConfig => ({
    url: process.env.DATABASE_URL,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  }),
);
