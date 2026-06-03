import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { TenantGuard } from '@madinatyai/tenancy';
import { SoukElKantoService } from '../soukelkanto.service';

@ApiTags('Souk ElKanto — Favorites')
@Controller('favorites')
@UseGuards(TenantGuard)
export class FavoritesController {
  constructor(private readonly souk: SoukElKantoService) {}

  @Post(':listingId')
  @AuditAction({ action: 'souk.favorite.add', target: 'favorite' })
  add(@Param('listingId') listingId: string) {
    const userId = 'demo-user';
    return this.souk.addFavorite(userId, listingId);
  }

  @Delete(':listingId')
  @AuditAction({ action: 'souk.favorite.remove', target: 'favorite' })
  remove(@Param('listingId') listingId: string) {
    const userId = 'demo-user';
    return this.souk.removeFavorite(userId, listingId);
  }

  @Get()
  list() {
    const userId = 'demo-user';
    return this.souk.listFavorites(userId);
  }
}
