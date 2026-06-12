import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { BusinessService } from '@madinatyai/business';
import { TenantContextService } from '@madinatyai/prisma';
import type {
  CreateBusinessDto,
  UpdateBrandingDto,
  UpdateBusinessProfileDto,
} from '@madinatyai/business';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

/**
 * REST API for managing sub-tenant businesses (Kitchen restaurants, Tutor centres).
 * The tenant is resolved from the request context; the business tenant type
 * is inferred from the subdomain (kitchen → KitchenBusiness, tutor → TutorBusiness).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * R-11 F-06 — Auth hardening
 * ─────────────────────────────────────────────────────────────────────────
 * Before this commit, every endpoint took `ownerGlobalUserId` from the body
 * and had no role guards. Any logged-in user could register a business under
 * another user's name, then edit/deactivate competitors.
 *
 * Now:
 *   - `create` binds `ownerGlobalUserId` from the JWT and the DTO no longer
 *     carries it (forbidNonWhitelisted rejects body attempts).
 *   - `updateBranding`, `updateProfile`, `deactivate` load the target row and
 *     verify the caller is the registered owner. PLATFORM_ADMIN bypass is
 *     intentionally NOT added here in v1 — admins go through a separate
 *     internal CLI for ops.
 *
 * NOTE: `list` and `getBySlug` remain auth-bound (global JwtAuthGuard) but
 * publicly readable across users. Business profiles are not secrets.
 */
@ApiTags('Business')
@ApiBearerAuth()
@Controller('business')
export class BusinessController {
  constructor(
    private readonly business: BusinessService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /** Resolve which tenant type to use for business operations. */
  private getTenant(): 'kitchen' | 'tutor' {
    const ctx = this.tenantContext.getOrThrow();
    if (ctx.subdomain === 'kitchen') return 'kitchen';
    if (ctx.subdomain === 'tutor') return 'tutor';
    throw new Error(`Tenant ${ctx.subdomain} does not support business sub-tenancy`);
  }

  private async assertOwner(
    tenant: 'kitchen' | 'tutor',
    businessId: string,
    callerId: string,
  ): Promise<void> {
    const slug = await this.business
      // Load by id is not in the service; cheat using getBusiness via slug lookup is
      // unsuitable. Instead we read the raw row via the service's loadById helper
      // (added below if missing).
      .loadById(tenant, businessId);
    if (!slug) {
      throw new ForbiddenException('Business not found');
    }
    if (slug.ownerGlobalUserId !== callerId) {
      throw new ForbiddenException('Not the owner');
    }
  }

  @Post()
  @AuditAction({ action: 'business.create', target: 'business' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBusinessDto,
  ) {
    return this.business.createBusiness(this.getTenant(), user.id, dto);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.business.getBusiness(this.getTenant(), slug);
  }

  @Get()
  list(@Query('activeOnly') activeOnly?: string) {
    return this.business.listBusinesses(this.getTenant(), activeOnly !== 'false');
  }

  @Patch(':id/branding')
  @AuditAction({ action: 'business.updateBranding', target: 'business' })
  async updateBranding(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBrandingDto,
  ) {
    await this.assertOwner(this.getTenant(), id, user.id);
    return this.business.updateBranding(this.getTenant(), id, dto);
  }

  @Patch(':id/profile')
  @AuditAction({ action: 'business.updateProfile', target: 'business' })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessProfileDto,
  ) {
    await this.assertOwner(this.getTenant(), id, user.id);
    return this.business.updateProfile(this.getTenant(), id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @AuditAction({ action: 'business.deactivate', target: 'business' })
  async deactivate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.assertOwner(this.getTenant(), id, user.id);
    return this.business.deactivateBusiness(this.getTenant(), id);
  }
}
