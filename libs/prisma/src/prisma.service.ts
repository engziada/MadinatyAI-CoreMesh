import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Single multiSchema Prisma client for the whole hub.
 *
 * Tenant isolation strategy: SEPARATE PostgreSQL schemas.
 * Every model is bound to a physical schema via `@@schema(...)` in
 * `schema.prisma` (core / tenant_souq / tenant_kitchen / ...). This client
 * can reach all of them; the {@link TenantContextService} determines which
 * tenant schema the current request is allowed to operate on, and tenant
 * repositories only touch that tenant's models.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma connected (multiSchema: core + tenant_*)');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Execute raw SQL scoped to a tenant schema by setting `search_path`
   * inside a transaction. Useful for dynamic, schema-pointed operations
   * on tenant tables that are provisioned outside the static client.
   */
  async withTenantSchema<T>(
    schemaName: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      // Safe: schemaName is validated against the known tenant map upstream.
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schemaName}", core`);
      return fn(tx);
    });
  }
}
