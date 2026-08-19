import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadsService } from './uploads.service';

class PresignRequestDto {
  @IsString()
  @MaxLength(200)
  fileName!: string;

  @IsString()
  @IsOptional()
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType?: string;
}

interface AuthedRequest extends Request {
  user: { userId: string; email: string };
}

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presign')
  presign(@Req() req: AuthedRequest, @Body() dto: PresignRequestDto) {
    const contentType = dto.contentType ?? 'image/jpeg';
    return this.uploadsService.presign(req.user.userId, dto.fileName, contentType);
  }
}
