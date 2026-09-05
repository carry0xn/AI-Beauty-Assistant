import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ChatMessageRequestDto } from '@aura/contracts';

import { AuthedRequest, JwtAuthGuard } from './jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  sendMessage(@Body() dto: ChatMessageRequestDto, @Req() req: AuthedRequest) {
    return this.chatService.sendMessage(dto, req);
  }
}