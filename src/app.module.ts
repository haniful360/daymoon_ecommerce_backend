import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestLoggerMiddleware } from './common/middlewares';
import {
  appConfig,
  cloudinaryConfig,
  databaseConfig,
  jwtConfig,
  mailConfig,
  redisConfig,
  seedConfig,
  stripeConfig,
} from './config';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/mail/mail.module';
import { RedisModule } from './modules/redis/redis.module';
import { SellerModule } from './modules/seller/seller.module';
import { UploadModule } from './modules/upload/upload.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [
        appConfig,
        jwtConfig,
        cloudinaryConfig,
        databaseConfig,
        stripeConfig,
        seedConfig,
        redisConfig,
        mailConfig,
      ],
    }),
    PrismaModule,
    RedisModule,
    MailModule,
    UploadModule,
    AuthModule,
    SellerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
