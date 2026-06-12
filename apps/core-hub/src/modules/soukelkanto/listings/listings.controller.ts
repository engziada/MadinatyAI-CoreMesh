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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { TenantGuard } from '@madinatyai/tenancy';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { SoukElKantoService } from '../soukelkanto.service';
import {
  CreateListingDto,
  SoukCategory,
  SoukCondition,
  UpdateListingDto,
} from '../dto/create-listing.dto';
import { PhotoUploadUrlDto } from '../dto/photo-upload.dto';
import { ReportListingDto } from '../dto/report-listing.dto';

@ApiTags('Souk ElKanto — Listings')
@Controller('listings')
@UseGuards(TenantGuard)
export class ListingsController {
  constructor(private readonly souk: SoukElKantoService) {}

  /**
   * "My listings (any status)" — for the My Activity page. Unlike public
   * `GET /listings` which filters to ACTIVE, this returns the user's listings
   * across every status (ACTIVE / RESERVED / REMOVED / EXPIRED). Auth-bound.
   */
  @Get('mine')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List the authenticated user\'s own listings (any status)' })
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.souk.listMyListings(user.id);
  }

  /** Browse — anonymous-friendly. */
  @Public()
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

  /**
   * Issue a Cloudflare R2 presigned PUT URL the FE uses to upload a single
   * listing photo directly to object storage. Declared before `:id` so the
   * static path wins routing.
   */
  @Post('photo-upload-url')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a presigned R2 PUT URL for one photo' })
  @AuditAction({ action: 'souk.listing.photoUploadUrl', target: 'listing' })
  photoUploadUrl(@CurrentUser() user: AuthenticatedUser, @Body() dto: PhotoUploadUrlDto) {
    return this.souk.requestPhotoUploadUrl(user.id, dto);
  }

  /** Single listing detail — also anonymous-friendly. */
  @Public()
  @Get(':id')
  get(@Param('id') id: string) {
    return this.souk.getListing(id);
  }

  @Post()
  @ApiBearerAuth()
  @AuditAction({ action: 'souk.listing.create', target: 'listing' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateListingDto) {
    return this.souk.createListing(user.id, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @AuditAction({ action: 'souk.listing.update', target: 'listing' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.souk.updateListing(id, user.id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @AuditAction({ action: 'souk.listing.delete', target: 'listing' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.souk.deleteListing(id, user.id);
  }

  /**
   * File a report against a listing. Convenience wrapper over the cross-
   * platform reports pipeline; auto-fills originSubdomain=kanto and offender
   * from the listing's seller.
   */
  @Post(':id/report')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report this listing' })
  @AuditAction({ action: 'souk.listing.report', target: 'listing' })
  report(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReportListingDto,
  ) {
    return this.souk.reportListing(user.id, id, {
      // ReportListingDto's incidentType is an enum mirror of Prisma's
      // IncidentType — cast is safe because validation already constrained it.
      incidentType: dto.incidentType as unknown as import('@prisma/client').IncidentType,
      severity: dto.severity,
      reason: dto.reason,
      evidencePhotoR2Key: dto.evidencePhotoR2Key,
    });
  }
}
