import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TenantContextService } from './tenant-context';

/**
 * Global module exposing the shared Prisma client and the request-scoped
 * tenant context service to every other module in the hub.
 */
@Global()
@Module({
  providers: [PrismaService, TenantContextService],
  exports: [PrismaService, TenantContextService],
})
export class PrismaModule {}
