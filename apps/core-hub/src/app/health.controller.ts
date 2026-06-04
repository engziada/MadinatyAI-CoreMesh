import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../modules/auth/decorators/public.decorator';

/** Liveness/readiness endpoint for load balancers and container healthchecks. */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  health() {
    return { status: 'ok', service: 'madinatyai-core-hub', timestamp: new Date().toISOString() };
  }
}
