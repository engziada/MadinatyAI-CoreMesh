import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Roles } from '@madinatyai/common';
import { Public } from '../auth/decorators/public.decorator';
import { MadintyLifeService } from './life.service';
import { LifeLocationType, LifeBookingType, LifeBookingStatus } from '@prisma/client';
import {
  CreateLocationDto,
  UpdateLocationDto,
  CreateLifeItemDto,
  UpdateLifeItemDto,
  CreateLifeBookingDto,
  UpdateBookingStatusDto,
  CreateLifePostDto,
  AddLifePhotoDto,
} from './dto';

@ApiTags('Madinty Life — Locations')
@Controller('life/locations')
export class MadintyLifeController {
  constructor(private readonly lifeService: MadintyLifeService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List locations filtered by parent, type, or query' })
  list(
    @Query('q') q?: string,
    @Query('parentId') parentId?: string,
    @Query('type') type?: LifeLocationType,
  ) {
    return this.lifeService.listLocations({ q, parentId, type });
  }

  @Public()
  @Get('tree')
  @ApiOperation({ summary: 'Get entire locations hierarchy tree' })
  getTree(@Query('rootId') rootId?: string) {
    const parentId = rootId === 'null' || rootId === '' ? null : rootId || null;
    return this.lifeService.getSubtreeHierarchy(parentId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get single location details including children and breadcrumbs' })
  get(@Param('id') id: string) {
    return this.lifeService.getLocation(id);
  }

  @Post()
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new location (Admin only)' })
  create(@Body() dto: CreateLocationDto) {
    return this.lifeService.createLocation(dto);
  }

  @Patch(':id')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing location (Admin only)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.lifeService.updateLocation(id, dto);
  }

  @Delete(':id')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a location and all of its descendants (Admin only)' })
  remove(@Param('id') id: string) {
    return this.lifeService.deleteLocation(id);
  }

  // ── STOREFRONT ITEMS ENDPOINTS ──
  @Public()
  @Get(':id/items')
  @ApiOperation({ summary: 'Get all catalog/menu items for a location' })
  getItems(@Param('id') id: string) {
    return this.lifeService.getItems(id);
  }

  @Post(':id/items')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new catalog/menu item (Admin only)' })
  createItem(
    @Param('id') id: string,
    @Body() dto: CreateLifeItemDto,
  ) {
    return this.lifeService.createItem(id, dto);
  }

  @Patch('items/:itemId')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing catalog/menu item (Admin only)' })
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateLifeItemDto,
  ) {
    return this.lifeService.updateItem(itemId, dto);
  }

  @Delete('items/:itemId')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a catalog/menu item (Admin only)' })
  removeItem(@Param('itemId') itemId: string) {
    return this.lifeService.deleteItem(itemId);
  }

  // ── STOREFRONT BOOKINGS ENDPOINTS ──
  @Get(':id/bookings')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bookings/orders for a location (Admin only)' })
  getBookings(
    @Param('id') id: string,
    @Query('type') type?: LifeBookingType,
    @Query('status') status?: LifeBookingStatus,
  ) {
    return this.lifeService.getBookings(id, type, status);
  }

  @Public()
  @Post(':id/bookings')
  @ApiOperation({ summary: 'Create a booking/order for a location' })
  createBooking(
    @Param('id') id: string,
    @Body() dto: CreateLifeBookingDto,
  ) {
    return this.lifeService.createBooking(id, dto);
  }

  @Patch('bookings/:bookingId/status')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking status (Admin only)' })
  updateBookingStatus(
    @Param('bookingId') bookingId: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.lifeService.updateBookingStatus(bookingId, dto.status);
  }

  // ── STOREFRONT POSTS ENDPOINTS ──
  @Public()
  @Get(':id/posts')
  @ApiOperation({ summary: 'Get all news posts/promotions for a location' })
  getPosts(@Param('id') id: string) {
    return this.lifeService.getPosts(id);
  }

  @Post(':id/posts')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a news post/promotion for a location (Admin only)' })
  createPost(
    @Param('id') id: string,
    @Body() dto: CreateLifePostDto,
  ) {
    return this.lifeService.createPost(id, dto);
  }

  @Delete('posts/:postId')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a news post (Admin only)' })
  removePost(@Param('postId') postId: string) {
    return this.lifeService.deletePost(postId);
  }

  // ── STOREFRONT PHOTOS ENDPOINTS ──
  @Public()
  @Get(':id/photos')
  @ApiOperation({ summary: 'Get photo gallery for a location' })
  getPhotos(@Param('id') id: string) {
    return this.lifeService.getPhotos(id);
  }

  @Post(':id/photos')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a photo to gallery (Admin only)' })
  addPhoto(
    @Param('id') id: string,
    @Body() dto: AddLifePhotoDto,
  ) {
    return this.lifeService.addPhoto(id, dto);
  }

  @Delete('photos/:photoId')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a photo from gallery (Admin only)' })
  removePhoto(@Param('photoId') photoId: string) {
    return this.lifeService.deletePhoto(photoId);
  }
}
