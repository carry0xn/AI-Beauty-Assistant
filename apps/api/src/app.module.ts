import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { S3Module } from './s3/s3.module';
import { QueueModule } from './queue/queue.module';
import { AnalysesModule } from './modules/analyses/analyses.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    PrismaModule,
    S3Module,
    QueueModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'aura-dev-secret',
      signOptions: { expiresIn: '1h' }
    }),
    UsersModule,
    AuthModule,
    AnalysesModule,
    RecommendationsModule,
    ProductsModule,
    UploadsModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
