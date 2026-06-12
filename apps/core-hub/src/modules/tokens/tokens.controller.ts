import { Body, Controller, ForbiddenException, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { Roles } from '@madinatyai/common';
import {
  TokensService,
  CreditTokensDto,
  SpendTokensDto,
  AllocateTokensDto,
  SetPricingDto,
} from '@madinatyai/tokens';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

/**
 * Token wallet controller. Provides endpoints for users to view their wallet,
 * spend/allocate their own tokens, and for PLATFORM_ADMINs to credit tokens
 * and set activity pricing.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * R-11 F-03 — Auth hardening
 * ─────────────────────────────────────────────────────────────────────────
 * Before this commit, every endpoint took the actor `userId` from the request
 * body without consulting the JWT. Any logged-in user could mint themselves
 * unlimited credits or drain another user's wallet. Now:
 *   - /credit, /setPricing, /wallet (admin lookup) require @Roles('PLATFORM_ADMIN').
 *   - /spend, /allocate bind userId from @CurrentUser() — DTOs no longer accept
 *     a userId field (validator rejects it via forbidNonWhitelisted).
 *   - /wallet/me is unchanged (already @CurrentUser-bound).
 */
@ApiTags('Tokens')
@ApiBearerAuth()
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokens: TokensService) {}

  /** PLATFORM_ADMIN: credit tokens to a user's wallet after offline cash payment. */
  @Post('credit')
  @Roles('PLATFORM_ADMIN')
  @AuditAction({ action: 'tokens.credit', target: 'wallet' })
  async credit(@Body() dto: CreditTokensDto) {
    return this.tokens.credit(dto.userId, dto.amount, dto.tokenType, dto.reason);
  }

  /** Spend tokens on an ecosystem activity. Actor = JWT user. */
  @Post('spend')
  @AuditAction({ action: 'tokens.spend', target: 'wallet' })
  async spend(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SpendTokensDto,
  ) {
    return this.tokens.spend(user.id, dto.activityType, dto.tokenType, dto.referenceId);
  }

  /** Allocate tokens to a specific activity budget. Actor = JWT user. */
  @Post('allocate')
  @AuditAction({ action: 'tokens.allocate', target: 'wallet' })
  async allocate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AllocateTokensDto,
  ) {
    return this.tokens.allocate(user.id, dto.activityType, dto.tokenType, dto.amount);
  }

  /**
   * Admin lookup: read any user's wallet.
   *
   * R-11 F-03: previously any authenticated user could query
   * `?userId=<anyone>` and read another user's wallet. Now restricted to
   * PLATFORM_ADMIN. Regular users hit /wallet/me below.
   */
  @Get('wallet')
  @Roles('PLATFORM_ADMIN')
  async wallet(@Query('userId') userId: string) {
    if (!userId) {
      throw new ForbiddenException('userId query parameter is required');
    }
    return this.tokens.getWallet(userId);
  }

  /** Authenticated user shortcut — resolves the principal from the JWT. */
  @Get('wallet/me')
  @ApiOperation({ summary: 'Get the authenticated user\'s wallet' })
  async myWallet(@CurrentUser() user: AuthenticatedUser) {
    return this.tokens.getWallet(user.id);
  }

  /** List all active activity pricing entries. Read-only public-tier data. */
  @Get('pricing')
  async pricing() {
    return this.tokens.listActivityPricing();
  }

  /** PLATFORM_ADMIN: set or update activity pricing. */
  @Post('pricing')
  @Roles('PLATFORM_ADMIN')
  @AuditAction({ action: 'tokens.setPricing', target: 'pricing' })
  async setPricing(@Body() dto: SetPricingDto) {
    return this.tokens.setActivityPricing(
      dto.activityType,
      dto.cost,
      dto.description,
      dto.isActive,
    );
  }
}
