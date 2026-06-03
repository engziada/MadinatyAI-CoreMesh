import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { TenantGuard } from '@madinatyai/tenancy';
import { SoukElKantoService } from '../soukelkanto.service';
import {
  CreateListingDto,
  SoukCategory,
  SoukCondition,
  UpdateListingDto,
} from '../dto/create-listing.dto';

@ApiTags('Souk ElKanto — Listings')
@Controller('listings')
@UseGuards(TenantGuard)
export class ListingsController {
  constructor(private readonly souk: SoukElKantoService) {}

  @Get()
  list(
    @Query('category') category?: string,
    @Query('condition') condition?: string,
    @Query('district') district?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.souk.listListings({
      category: category as SoukCategory | undefined,
      condition: condition as SoukCondition | undefined,
      district,
      minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
      q,
      sort,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.souk.getListing(id);
  }

  @Post()
  @AuditAction({ action: 'souk.listing.create', target: 'listing' })
  create(@Body() dto: CreateListingDto) {
    // In a real app, sellerId comes from JWT auth context.
    const sellerId = dto.photos?.[0]?.r2Key?.split('/')[1] ?? 'demo-user';
    return this.souk.createListing(sellerId, dto);
  }

  @Patch(':id')
  @AuditAction({ action: 'souk.listing.update', target: 'listing' })
  update(@Param('id') id: string, @Body() dto: UpdateListingDto) {
    const sellerId = 'demo-user';
    return this.souk.updateListing(id, sellerId, dto);
  }

  @Delete(':id')
  @AuditAction({ action: 'souk.listing.delete', target: 'listing' })
  remove(@Param('id') id: string) {
    const sellerId = 'demo-user';
    return this.souk.deleteListing(id, sellerId);
  }
}
