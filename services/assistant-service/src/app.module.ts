import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { HealthController } from './health.controller';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'aura-dev-secret',
      signOptions: { expiresIn: '1h' }
    }),
    ChatModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
