import { Injectable, NotFoundException } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class InternalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const expected = process.env.INTERNAL_API_KEY ?? 'aura-internal-dev-key';
    return request.headers['x-internal-key'] === expected;
  }
}
