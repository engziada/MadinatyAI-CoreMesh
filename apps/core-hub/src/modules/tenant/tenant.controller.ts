import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TenantContextService } from '@madinatyai/prisma';
import { TenantGuard } from '@madinatyai/tenancy';
import { TenantItemsService } from './tenant-items.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

/**
 * Tenant-scoped routes. {@link TenantGuard} rejects requests lacking a valid
 * tenant (subdomain / x-tenant-id). Data operations are isolated to the
 * active tenant's PostgreSQL schema.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * R-11 F-07 — Auth hardening
 * ─────────────────────────────────────────────────────────────────────────
 * Previously `createItem` accepted `ownerGlobalUserId` from the body — any
 * authenticated user could create items attributed to any victim, spamming
 * tenant schemas with garbage under legitimate users' identities.
 * Now bound from the JWT.
 */
@ApiTags('Tenant')
@ApiBearerAuth()
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
  createItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body('title') title: string,
  ) {
    return this.items.create(user.id, title);
  }

  @Get('items')
  listItems() {
    return this.items.list();
  }
}
