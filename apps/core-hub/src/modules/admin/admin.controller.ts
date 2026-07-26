import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Roles } from '@madinatyai/common';
import { EcosystemAdminService } from './admin.service';
import { SoukListingStatus, SoukDisputeStatus } from '@prisma/client';

@ApiTags('MadinatyAI — Admin')
@ApiBearerAuth()
@Controller('admin-api')
export class EcosystemAdminController {
  constructor(private readonly adminService: EcosystemAdminService) {}

  @Get('stats')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get unified statistics for Souq ElKanto and Kitchens' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('souq/listings')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get all listings with pagination and filters' })
  getListings(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: SoukListingStatus,
    @Query('category') category?: string,
    @Query('q') q?: string,
  ) {
    return this.adminService.getListings({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
      category,
      q,
    });
  }

  @Get('souq/disputes')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get P2P disputes with filer/offender details' })
  getDisputes(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: SoukDisputeStatus,
  ) {
    return this.adminService.getDisputes({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
    });
  }

  @Get('kitchens')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get all kitchen businesses with pagination and filters' })
  getKitchens(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('q') q?: string,
    @Query('isActive') isActive?: string,
    @Query('status') status?: string,
  ) {
    let activeFilter: boolean | undefined;
    if (isActive === 'true') activeFilter = true;
    if (isActive === 'false') activeFilter = false;

    return this.adminService.getKitchens({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      q,
      isActive: activeFilter,
      status,
    });
  }

  @Patch('kitchens/:id/toggle-active')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Toggle active state of a kitchen business' })
  toggleKitchenActive(@Param('id') id: string) {
    return this.adminService.toggleKitchenActive(id);
  }

  @Patch('kitchens/:id/approve')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Approve and activate a kitchen business request' })
  approveKitchen(@Param('id') id: string) {
    return this.adminService.approveKitchen(id);
  }

  @Patch('kitchens/:id/reject')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Reject a kitchen business request' })
  rejectKitchen(@Param('id') id: string) {
    return this.adminService.rejectKitchen(id);
  }

  @Patch('kitchens/:id/branding')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update branding (tokens, financials, delivery) of a kitchen business' })
  updateKitchenBranding(
    @Param('id') id: string,
    @Body() body: { branding: any },
  ) {
    return this.adminService.updateKitchenBranding(id, body.branding);
  }

  @Get('users')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get platform users and their interaction counts' })
  getUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('q') q?: string,
  ) {
    return this.adminService.getUsers({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      q,
    });
  }

  @Get('express/couriers')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get all delivery couriers with pagination and filters' })
  getExpressCouriers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getExpressCouriers({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      q,
      status,
    });
  }

  @Patch('express/couriers/:id/approve')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Approve a delivery courier request' })
  approveCourier(@Param('id') id: string) {
    return this.adminService.approveCourier(id);
  }

  @Patch('express/couriers/:id/reject')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Reject a delivery courier request' })
  rejectCourier(@Param('id') id: string) {
    return this.adminService.rejectCourier(id);
  }

  @Get('express/deliveries')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get all delivery requests with pagination and status filter' })
  getExpressDeliveries(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
  ) {
    return this.adminService.getExpressDeliveries({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
    });
  }
}
