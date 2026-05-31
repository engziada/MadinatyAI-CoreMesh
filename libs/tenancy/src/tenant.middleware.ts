import { BadRequestException, ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaService, TenantContextService } from '@madinatyai/prisma';
import { TENANT_HEADER } from '@madinatyai/common';
import { isKnownTenant, resolveSubdomainFromHost, schemaForSubdomain } from './tenant-resolver';

/**
 * Intercepts every request, derives the tenant from the `x-tenant-id` header
 * (preferred) or the Host subdomain, validates it against the core `Tenant`
 * table, and binds a {@link TenantContext} for the request lifecycle.
 *
 * Tenant-agnostic routes (health, AI utilities) simply receive no context.
 * Invalid/inactive tenants are rejected here; missing-but-required tenants
 * are rejected later by {@link TenantGuard}.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly config: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const rootDomain = this.config.get<string>('rootDomain') ?? 'madinatyai.com';

    const headerTenant = (req.headers[TENANT_HEADER] as string | undefined)?.trim().toLowerCase();
    const subdomain = headerTenant || resolveSubdomainFromHost(req.headers.host, rootDomain);

    if (!subdomain) {
      // No tenant indicated — continue for global/tenant-agnostic routes.
      return next();
    }

    if (!isKnownTenant(subdomain)) {
      throw new BadRequestException(`Unknown tenant '${subdomain}'`);
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { subdomain } });
    if (!tenant) {
      throw new BadRequestException(`Tenant '${subdomain}' is not provisioned`);
    }
    if (!tenant.isActive) {
      throw new ForbiddenException(`Tenant '${subdomain}' is inactive`);
    }

    const schemaName = schemaForSubdomain(subdomain) ?? tenant.schemaName;

    this.tenantContext.run(
      {
        tenantId: tenant.id,
        subdomain: tenant.subdomain,
        schemaName,
        tierLevel: tenant.tierLevel,
      },
      () => next(),
    );
  }
}
