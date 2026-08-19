import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ChatMessageRequestDto } from '@aura/contracts';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ChatService {
  constructor(private readonly httpService: HttpService) {}

  async sendMessage(dto: ChatMessageRequestDto) {
    const bffUrl = process.env.BFF_URL ?? 'http://localhost:3001';

    try {
      await firstValueFrom(this.httpService.get(`${bffUrl}/health`));
    } catch {
      // BFF is optional at scaffold stage.
    }

    return {
      reply: 'Assistant stub response',
      received: dto
    };
  }
}
