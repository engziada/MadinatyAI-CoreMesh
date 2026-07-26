import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ExpressService } from './express.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CourierProfileDto, ToggleOnlineDto, CreateDeliveryRequestDto } from './dto';

@ApiTags('Express Delivery')
@ApiBearerAuth()
@Controller('express-api')
export class ExpressController {
  constructor(private readonly expressService: ExpressService) {}

  /**
   * Register as a delivery courier.
   */
  @Post('courier')
  @ApiOperation({ summary: 'Register a new delivery courier profile' })
  registerCourier(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CourierProfileDto,
  ) {
    return this.expressService.createCourier(user.id, dto);
  }

  /**
   * Update the courier profile while it is still under admin review.
   */
  @Patch('courier')
  @ApiOperation({ summary: 'Update courier profile before admin approval' })
  updateCourierProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CourierProfileDto,
  ) {
    return this.expressService.updateCourierProfile(user.id, dto);
  }

  /**
   * Get current courier profile details.
   */
  @Get('courier/me')
  @ApiOperation({ summary: 'Get current user courier profile' })
  getCourierProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.expressService.getCourierByUserId(user.id);
  }

  /**
   * Toggle courier online/offline status.
   */
  @Patch('courier/online')
  @ApiOperation({ summary: 'Toggle online/offline status for courier' })
  toggleOnline(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ToggleOnlineDto,
  ) {
    return this.expressService.toggleOnline(user.id, dto.isOnline);
  }

  /**
   * Get available delivery requests for online couriers.
   */
  @Get('deliveries/available')
  @ApiOperation({ summary: 'List available delivery requests for online couriers' })
  getAvailableDeliveries(@CurrentUser() user: AuthenticatedUser) {
    return this.expressService.getAvailableDeliveries(user.id);
  }

  /**
   * Get current active delivery request for courier.
   */
  @Get('deliveries/active')
  @ApiOperation({ summary: 'Get current active delivery for courier' })
  getActiveDelivery(@CurrentUser() user: AuthenticatedUser) {
    return this.expressService.getActiveDelivery(user.id);
  }

  /**
   * Accept a delivery request.
   */
  @Patch('deliveries/:id/accept')
  @ApiOperation({ summary: 'Courier accepts a delivery request' })
  acceptDelivery(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.expressService.acceptDelivery(user.id, id);
  }

  /**
   * Mark delivery request as picked up.
   */
  @Patch('deliveries/:id/pickup')
  @ApiOperation({ summary: 'Courier marks a delivery request as picked up' })
  pickupDelivery(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.expressService.pickupDelivery(user.id, id);
  }

  /**
   * Mark delivery request as completed/delivered.
   */
  @Patch('deliveries/:id/deliver')
  @ApiOperation({ summary: 'Courier marks a delivery request as delivered' })
  completeDelivery(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.expressService.completeDelivery(user.id, id);
  }

  /**
   * Kitchen creates a delivery request.
   */
  @Post('deliveries')
  @ApiOperation({ summary: 'Kitchen creates a new delivery request' })
  createDeliveryRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDeliveryRequestDto,
  ) {
    return this.expressService.createDeliveryRequest(user.id, dto);
  }

  /**
   * Kitchen lists its delivery requests.
   */
  @Get('deliveries/kitchen')
  @ApiOperation({ summary: 'Get all delivery requests created by the kitchen' })
  getKitchenDeliveries(@CurrentUser() user: AuthenticatedUser) {
    return this.expressService.getDeliveriesByKitchen(user.id);
  }

  /**
   * Get single delivery details.
   */
  @Get('deliveries/:id')
  @ApiOperation({ summary: 'Get single delivery request details' })
  getDeliveryDetails(@Param('id') id: string) {
    return this.expressService.getDeliveryRequestById(id);
  }
}
