import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { TenantGuard } from '@madinatyai/tenancy';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { SoukElKantoService } from '../soukelkanto.service';
import { CounterOfferDto, CreateOfferDto, DeclineOfferDto } from '../dto/create-offer.dto';

@ApiTags('Souk ElKanto — Offers')
@ApiBearerAuth()
@Controller('offers')
@UseGuards(TenantGuard)
export class OffersController {
  constructor(private readonly souk: SoukElKantoService) {}

  @Post()
  @AuditAction({ action: 'souk.offer.create', target: 'offer' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOfferDto) {
    return this.souk.createOffer(user.id, dto);
  }

  @Patch(':id/accept')
  @AuditAction({ action: 'souk.offer.accept', target: 'offer' })
  accept(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.souk.acceptOffer(id, user.id);
  }

  @Patch(':id/decline')
  @AuditAction({ action: 'souk.offer.decline', target: 'offer' })
  decline(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: DeclineOfferDto,
  ) {
    return this.souk.declineOffer(id, user.id, dto.reason);
  }

  @Patch(':id/counter')
  @AuditAction({ action: 'souk.offer.counter', target: 'offer' })
  counter(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CounterOfferDto,
  ) {
    return this.souk.counterOffer(id, user.id, dto.amount);
  }

  @Patch(':id/withdraw')
  @AuditAction({ action: 'souk.offer.withdraw', target: 'offer' })
  withdraw(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.souk.withdrawOffer(id, user.id);
  }

  // ── R-02 · Buyer-side counter actions ──────────────────────────────
  //
  // These mirror /accept, /decline, /counter but require that the caller is
  // the offer's buyer AND that the offer is a seller-initiated counter
  // (parentOfferId !== null). Service-layer guards enforce both.

  @Patch(':id/buyer-accept')
  @AuditAction({ action: 'souk.offer.buyerAccept', target: 'offer' })
  buyerAccept(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.souk.buyerAcceptCounter(id, user.id);
  }

  @Patch(':id/buyer-decline')
  @AuditAction({ action: 'souk.offer.buyerDecline', target: 'offer' })
  buyerDecline(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: DeclineOfferDto,
  ) {
    return this.souk.buyerDeclineCounter(id, user.id, dto.reason);
  }

  @Patch(':id/buyer-counter')
  @AuditAction({ action: 'souk.offer.buyerCounter', target: 'offer' })
  buyerCounter(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CounterOfferDto,
  ) {
    return this.souk.buyerCounterOffer(id, user.id, dto.amount);
  }

  @Get('sent')
  sent(@CurrentUser() user: AuthenticatedUser) {
    return this.souk.listSentOffers(user.id);
  }

  @Get('received')
  received(@CurrentUser() user: AuthenticatedUser) {
    return this.souk.listReceivedOffers(user.id);
  }
}
