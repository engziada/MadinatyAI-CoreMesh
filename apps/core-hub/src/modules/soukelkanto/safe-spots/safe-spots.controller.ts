import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantGuard } from '@madinatyai/tenancy';
import { SoukElKantoService } from '../soukelkanto.service';

@ApiTags('Souk ElKanto — Safe Meet Spots')
@Controller('safe-meet-spots')
@UseGuards(TenantGuard)
export class SafeSpotsController {
  constructor(private readonly souk: SoukElKantoService) {}

  @Get()
  list(@Query('district') district?: string) {
    return this.souk.listSafeMeetSpots(district);
  }

  @Get('nearest')
  nearest(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.souk.nearestSafeMeetSpots(parseFloat(lat), parseFloat(lng));
  }
}
