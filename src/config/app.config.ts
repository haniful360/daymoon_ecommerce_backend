import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port?: number;
  nodeEnv?: string;
  isProduction: boolean;
  apiPrefix?: string;
  frontendUrl?: string;
  corsOrigins?: string;
}

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
    nodeEnv: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === 'production',
    apiPrefix: process.env.API_PREFIX,
    frontendUrl: process.env.FRONTEND_URL,
    corsOrigins: process.env.CORS_ORIGIN,
  }),
);
