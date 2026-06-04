import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { TenantGuard } from '@madinatyai/tenancy';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { SoukElKantoService } from '../soukelkanto.service';
import { CreateRatingDto } from '../dto/create-rating.dto';

@ApiTags('Souk ElKanto — Ratings')
@ApiBearerAuth()
@Controller('ratings')
@UseGuards(TenantGuard)
export class RatingsController {
  constructor(private readonly souk: SoukElKantoService) {}

  @Post()
  @AuditAction({ action: 'souk.rating.create', target: 'rating' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRatingDto) {
    return this.souk.createRating(user.id, dto);
  }
}
