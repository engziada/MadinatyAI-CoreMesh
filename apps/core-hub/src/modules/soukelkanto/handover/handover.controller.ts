import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { TenantGuard } from '@madinatyai/tenancy';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { SoukElKantoService } from '../soukelkanto.service';

@ApiTags('Souk ElKanto — Handover')
@ApiBearerAuth()
@Controller('handover')
@UseGuards(TenantGuard)
export class HandoverController {
  constructor(private readonly souk: SoukElKantoService) {}

  @Post(':offerId/confirm')
  @AuditAction({ action: 'souk.handover.confirm', target: 'handover' })
  confirm(@CurrentUser() user: AuthenticatedUser, @Param('offerId') offerId: string) {
    return this.souk.confirmHandover(offerId, user.id);
  }
}
