import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { TrustMeterService } from './trust-meter.service';

/**
 * Public TrustMeter read endpoints — `api_contract §10`.
 *
 * Returns engagement-tier data the FE renders on listing cards, listing
 * detail, offer modals, and the /my/trust-meter dashboard. TrustScore is
 * NOT exposed here — it stays internal per CLAUDE.md.
 */
@ApiTags('TrustMeter')
@Controller('trust-meter')
export class TrustMeterController {
  constructor(private readonly trustMeter: TrustMeterService) {}

  /** Anyone (including anon browsers) can read another user's tier badge. */
  @Public()
  @Get('users/:userId')
  @ApiOperation({ summary: 'Public TrustMeter snapshot for any user' })
  getUser(@Param('userId') userId: string) {
    return this.trustMeter.getSnapshot(userId);
  }

  /** Convenience for the authenticated principal. */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'TrustMeter snapshot for the current user' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.trustMeter.getSnapshot(user.id);
  }

  /** Bonus grants awarded on tier-up — empty until full lib lands. */
  @Get('me/bonus-grants')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tier-upgrade bonus grants for the current user' })
  myBonusGrants(@CurrentUser() user: AuthenticatedUser) {
    return this.trustMeter.getBonusGrants(user.id);
  }
}
