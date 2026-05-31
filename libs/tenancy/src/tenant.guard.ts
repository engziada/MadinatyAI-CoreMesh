import { CanActivate, ExecutionContext, BadRequestException, Injectable } from '@nestjs/common';
import { TenantContextService } from '@madinatyai/prisma';

/**
 * Guard that protects tenant-scoped modules: it rejects any request that
 * reached a tenant route without a resolved tenant context (i.e. a missing
 * or unrecognised `x-tenant-id` / subdomain).
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContextService) {}

  canActivate(_context: ExecutionContext): boolean {
    const ctx = this.tenantContext.get();
    if (!ctx) {
      throw new BadRequestException(
        'Missing tenant. Provide a valid subdomain or x-tenant-id header.',
      );
    }
    return true;
  }
}
