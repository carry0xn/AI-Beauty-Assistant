import { Body, Controller, Post } from '@nestjs/common';
import { ChatMessageRequestDto } from '@aura/contracts';

import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  sendMessage(@Body() dto: ChatMessageRequestDto) {
    return this.chatService.sendMessage(dto);
  }
}
