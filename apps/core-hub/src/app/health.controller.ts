import { Controller, Get } from '@nestjs/common';

/** Liveness/readiness endpoint for load balancers and container healthchecks. */
@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { status: 'ok', service: 'madinatyai-core-hub', timestamp: new Date().toISOString() };
  }
}
