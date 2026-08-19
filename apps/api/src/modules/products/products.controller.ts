import { HttpService } from '@nestjs/axios';
import { Controller, Get } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Controller('products')
export class ProductsController {
  constructor(private readonly httpService: HttpService) {}

  @Get()
  async list() {
    const baseUrl = process.env.CATALOG_SERVICE_URL ?? 'http://localhost:3003';
    const response = await firstValueFrom(this.httpService.get(`${baseUrl}/products`));
    return response.data;
  }
}
