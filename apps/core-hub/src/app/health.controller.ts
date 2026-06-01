import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/** Liveness/readiness endpoint for load balancers and container healthchecks. */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { status: 'ok', service: 'madinatyai-core-hub', timestamp: new Date().toISOString() };
  }
}
