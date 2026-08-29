import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter, PrismaExceptionFilter } from './common/filters';
import { LoggingInterceptor, TransformInterceptor } from './common/interceptors';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Set API Global Prefix
  app.setGlobalPrefix('api/v1');

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Filters & Interceptors
  app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Swagger OpenAPI Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Daymoon B2B Marketplace & Factory Sourcing API')
    .setDescription(
      'Enterprise multi-vendor wholesale e-commerce and factory sourcing backend (Alibaba/Global Sources equivalent). ' +
        'Supports Buyer sourcing, Seller 5-step onboarding & membership tiers (Basic $119.99, Standard $299.99, Premium $599.99), ' +
        'Tiered Volume Pricing, MOQ, OEM Customizations, RFQs, Quotes, Trade Assurance Orders, and Super Admin Audits.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Authentication', 'User registration, login, JWT token refresh')
    .addTag('Users', 'User profiles and address book')
    .addTag('Sellers & Factory Sourcing', '5-step supplier onboarding wizard and storefront profiles')
    .addTag('Subscriptions & Membership Tiers', 'Supplier membership tiers and recurring billing')
    .addTag('Categories', 'Hierarchical category tree and technical attributes')
    .addTag('Products & Wholesale Catalog', 'Wholesale catalog with tiered pricing, MOQ, and OEM customization')
    .addTag('Cart & Bulk Wholesale Orders', 'Bulk shopping cart and MOQ tier calculation')
    .addTag('Orders & Trade Assurance', 'Multi-vendor order split, milestone tracking & escrow')
    .addTag('RFQs (Request for Quotations) & Sourcing', 'Buyer RFQ requests and supplier quotations')
    .addTag('Reviews & Ratings', 'Audited buyer reviews and supplier responses')
    .addTag('Payouts & Supplier Balance', 'Supplier balance withdrawals and payout management')
    .addTag('Super Admin & Financial Ledgers', 'Supplier KYC auditing, financial ledgers, and platform commissions')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Daymoon B2B Backend server is running on: http://localhost:${port}/api/v1`);
  logger.log(`Swagger OpenAPI Documentation available at: http://localhost:${port}/docs`);
}
bootstrap();
