import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Souk ElKanto Health')
@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { success: true, data: { status: 'ok', module: 'soukelkanto', version: '0.1.0' } };
  }
}
