import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { ProductsController } from './products.controller';

@Module({
  imports: [HttpModule],
  controllers: [ProductsController]
})
export class ProductsModule {}
