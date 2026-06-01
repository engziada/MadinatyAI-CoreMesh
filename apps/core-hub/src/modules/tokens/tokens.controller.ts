import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { TokensService, CreditTokensDto, SpendTokensDto, AllocateTokensDto, SetPricingDto } from '@madinatyai/tokens';

/**
 * Token wallet controller. Provides endpoints for users to view their wallet,
 * spend/allocate tokens, and for admins to credit tokens and set activity pricing.
 */
@ApiTags('Tokens')
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokens: TokensService) {}

  /** Admin: credit tokens to a user's wallet after offline cash payment. */
  @Post('credit')
  @AuditAction({ action: 'tokens.credit', target: 'wallet' })
  async credit(@Body() dto: CreditTokensDto) {
    return this.tokens.credit(dto.userId, dto.amount, dto.tokenType, dto.reason);
  }

  /** Spend tokens on an ecosystem activity. */
  @Post('spend')
  @AuditAction({ action: 'tokens.spend', target: 'wallet' })
  async spend(@Body() dto: SpendTokensDto) {
    return this.tokens.spend(dto.userId, dto.activityType, dto.tokenType, dto.referenceId);
  }

  /** Allocate tokens to a specific activity budget. */
  @Post('allocate')
  @AuditAction({ action: 'tokens.allocate', target: 'wallet' })
  async allocate(@Body() dto: AllocateTokensDto) {
    return this.tokens.allocate(dto.userId, dto.activityType, dto.tokenType, dto.amount);
  }

  /** Get the current user's wallet (balance + allocations + recent transactions). */
  @Get('wallet')
  async wallet(@Query('userId') userId: string) {
    return this.tokens.getWallet(userId);
  }

  /** List all active activity pricing entries. */
  @Get('pricing')
  async pricing() {
    return this.tokens.listActivityPricing();
  }

  /** Admin: set or update activity pricing. */
  @Post('pricing')
  @AuditAction({ action: 'tokens.setPricing', target: 'pricing' })
  async setPricing(@Body() dto: SetPricingDto) {
    return this.tokens.setActivityPricing(dto.activityType, dto.cost, dto.description, dto.isActive);
  }
}
