import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductsService {
  list() {
    return [
      { id: 'prod-1', sku: 'AURA-FOUND-001', name: 'Aura Foundation', category: 'makeup' },
      { id: 'prod-2', sku: 'AURA-LIP-001', name: 'Aura Lip Tint', category: 'makeup' }
    ];
  }
}
