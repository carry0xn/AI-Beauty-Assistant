import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthController } from './health.controller';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), HttpModule, ChatModule],
  controllers: [HealthController]
})
export class AppModule {}
