import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { TenantContextService } from '@madinatyai/prisma';
import { TenantGuard } from '@madinatyai/tenancy';
import { TenantItemsService } from './tenant-items.service';

/**
 * Tenant-scoped routes. {@link TenantGuard} rejects requests lacking a valid
 * tenant (subdomain / x-tenant-id). Data operations are isolated to the
 * active tenant's PostgreSQL schema.
 */
@Controller('tenant')
@UseGuards(TenantGuard)
export class TenantController {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly items: TenantItemsService,
  ) {}

  /** Echo the resolved tenant context (useful for debugging routing). */
  @Get('context')
  context() {
    return this.tenantContext.getOrThrow();
  }

  @Post('items')
  createItem(@Body('ownerGlobalUserId') ownerGlobalUserId: string, @Body('title') title: string) {
    return this.items.create(ownerGlobalUserId, title);
  }

  @Get('items')
  listItems() {
    return this.items.list();
  }
}
