import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { TenantGuard } from '@madinatyai/tenancy';
import { SoukElKantoService } from '../soukelkanto.service';
import { CounterOfferDto, CreateOfferDto, DeclineOfferDto } from '../dto/create-offer.dto';

@ApiTags('Souk ElKanto — Offers')
@Controller('offers')
@UseGuards(TenantGuard)
export class OffersController {
  constructor(private readonly souk: SoukElKantoService) {}

  @Post()
  @AuditAction({ action: 'souk.offer.create', target: 'offer' })
  create(@Body() dto: CreateOfferDto) {
    const buyerId = 'demo-buyer';
    return this.souk.createOffer(buyerId, dto);
  }

  @Patch(':id/accept')
  @AuditAction({ action: 'souk.offer.accept', target: 'offer' })
  accept(@Param('id') id: string) {
    const sellerId = 'demo-seller';
    return this.souk.acceptOffer(id, sellerId);
  }

  @Patch(':id/decline')
  @AuditAction({ action: 'souk.offer.decline', target: 'offer' })
  decline(@Param('id') id: string, @Body() dto: DeclineOfferDto) {
    const sellerId = 'demo-seller';
    return this.souk.declineOffer(id, sellerId, dto.reason);
  }

  @Patch(':id/counter')
  @AuditAction({ action: 'souk.offer.counter', target: 'offer' })
  counter(@Param('id') id: string, @Body() dto: CounterOfferDto) {
    const sellerId = 'demo-seller';
    return this.souk.counterOffer(id, sellerId, dto.amount);
  }

  @Patch(':id/withdraw')
  @AuditAction({ action: 'souk.offer.withdraw', target: 'offer' })
  withdraw(@Param('id') id: string) {
    const buyerId = 'demo-buyer';
    return this.souk.withdrawOffer(id, buyerId);
  }

  @Get('sent')
  sent() {
    const buyerId = 'demo-buyer';
    return this.souk.listSentOffers(buyerId);
  }

  @Get('received')
  received() {
    const sellerId = 'demo-seller';
    return this.souk.listReceivedOffers(sellerId);
  }
}
