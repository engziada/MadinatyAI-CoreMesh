import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService, TenantContextService } from '@madinatyai/prisma';

/**
 * Common shape shared by all four per-tenant placeholder models
 * (SouqListing / KitchenMenuItem / TutorBooking / TimeBankOffer). Casting the
 * resolved delegate to this avoids union-call errors while keeping type safety
 * on the operations we actually use.
 */
interface ItemDelegate {
  create(args: { data: { ownerGlobalUserId: string; title: string } }): Promise<unknown>;
  findMany(args: { orderBy: { createdAt: 'desc' }; take: number }): Promise<unknown[]>;
}

/**
 * Demonstrates tenant-scoped data access across SEPARATE PostgreSQL schemas.
 * The active tenant (from the request context) selects which physical schema
 * / model is used, so writes for `souq` land in `tenant_souq`, `kitchen` in
 * `tenant_kitchen`, etc. — proving isolation.
 */
@Injectable()
export class TenantItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /** Resolve the Prisma delegate bound to the active tenant's schema. */
  private delegate(): ItemDelegate {
    const { subdomain } = this.tenantContext.getOrThrow();
    switch (subdomain) {
      case 'souq':
        return this.prisma.souqListing as unknown as ItemDelegate;
      case 'kitchen':
        return this.prisma.kitchenMenuItem as unknown as ItemDelegate;
      case 'tutor':
        return this.prisma.tutorBooking as unknown as ItemDelegate;
      case 'timebank':
        return this.prisma.timeBankOffer as unknown as ItemDelegate;
      default:
        throw new BadRequestException(`No data model for tenant '${subdomain}'`);
    }
  }

  create(ownerGlobalUserId: string, title: string) {
    return this.delegate().create({ data: { ownerGlobalUserId, title } });
  }

  list() {
    return this.delegate().findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }
}
