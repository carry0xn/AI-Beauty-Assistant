import { Controller, Get } from '@nestjs/common';
import { Recommendation } from '@aura/shared';

@Controller('recommendations')
export class RecommendationsController {
  @Get()
  list(): Recommendation[] {
    return [
      {
        id: 'rec-1',
        category: 'style',
        title: 'Starter recommendation',
        description: 'Placeholder recommendation from BFF.'
      }
    ];
  }
}
