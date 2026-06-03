import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { TenantGuard } from '@madinatyai/tenancy';
import { SoukElKantoService } from '../soukelkanto.service';

@ApiTags('Souk ElKanto — Handover')
@Controller('handover')
@UseGuards(TenantGuard)
export class HandoverController {
  constructor(private readonly souk: SoukElKantoService) {}

  @Post(':offerId/confirm')
  @AuditAction({ action: 'souk.handover.confirm', target: 'handover' })
  confirm(@Param('offerId') offerId: string) {
    const userId = 'demo-user';
    return this.souk.confirmHandover(offerId, userId);
  }
}
