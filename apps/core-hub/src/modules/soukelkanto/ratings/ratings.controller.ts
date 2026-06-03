import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { TenantGuard } from '@madinatyai/tenancy';
import { SoukElKantoService } from '../soukelkanto.service';
import { CreateRatingDto } from '../dto/create-rating.dto';

@ApiTags('Souk ElKanto — Ratings')
@Controller('ratings')
@UseGuards(TenantGuard)
export class RatingsController {
  constructor(private readonly souk: SoukElKantoService) {}

  @Post()
  @AuditAction({ action: 'souk.rating.create', target: 'rating' })
  create(@Body() dto: CreateRatingDto) {
    const raterId = 'demo-user';
    return this.souk.createRating(raterId, dto);
  }
}
