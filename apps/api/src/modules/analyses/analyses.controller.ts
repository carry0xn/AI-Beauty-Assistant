import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalysesService } from './analyses.service';
import { InternalAuthGuard } from './internal-auth.guard';

class CreateAnalysisRequestDto {
  @IsString()
  imageKey!: string;

  @IsString()
  @IsIn(['face', 'body'])
  kind!: 'face' | 'body';
}

class UpdateResultRequestDto {
  @IsOptional()
  resultJson?: unknown;

  @IsOptional()
  error?: string | null;
}

interface AuthedRequest extends Request {
  user: { userId: string; email: string };
}

@Controller('analyses')
export class AnalysesController {
  constructor(private readonly analysesService: AnalysesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req: AuthedRequest) {
    return this.analysesService.findAll(req.user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: AuthedRequest, @Body() dto: CreateAnalysisRequestDto) {
    return this.analysesService.create(req.user.userId, dto.kind, dto.imageKey);
  }

  @Get('latest-result')
  @UseGuards(JwtAuthGuard)
  latestResult(@Req() req: AuthedRequest) {
    return this.analysesService.findLatestFaceResult(req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findById(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.analysesService.findById(req.user.userId, id);
  }

  @Patch(':id/result')
  @UseGuards(InternalAuthGuard)
  updateResult(@Param('id') id: string, @Body() dto: UpdateResultRequestDto) {
    return this.analysesService.updateResult(id, dto.resultJson, dto.error);
  }
}
