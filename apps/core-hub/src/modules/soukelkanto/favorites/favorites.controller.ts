import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { TenantGuard } from '@madinatyai/tenancy';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { SoukElKantoService } from '../soukelkanto.service';

@ApiTags('Souk ElKanto — Favorites')
@ApiBearerAuth()
@Controller('favorites')
@UseGuards(TenantGuard)
export class FavoritesController {
  constructor(private readonly souk: SoukElKantoService) {}

  @Post(':listingId')
  @AuditAction({ action: 'souk.favorite.add', target: 'favorite' })
  add(@CurrentUser() user: AuthenticatedUser, @Param('listingId') listingId: string) {
    return this.souk.addFavorite(user.id, listingId);
  }

  @Delete(':listingId')
  @AuditAction({ action: 'souk.favorite.remove', target: 'favorite' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('listingId') listingId: string) {
    return this.souk.removeFavorite(user.id, listingId);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.souk.listFavorites(user.id);
  }
}
