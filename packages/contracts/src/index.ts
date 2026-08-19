import { IsArray, IsOptional, IsString } from 'class-validator';

export class AnalyzeFaceRequestDto {
  @IsString()
  imageUrl!: string;
}

export class AnalyzeBodyRequestDto {
  @IsString()
  imageUrl!: string;
}

export class ChatMessageRequestDto {
  @IsString()
  userId!: string;

  @IsString()
  message!: string;
}

export class RecommendationDto {
  @IsString()
  id!: string;

  @IsString()
  category!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}
