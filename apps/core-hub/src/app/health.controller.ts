import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../modules/auth/decorators/public.decorator';

// Read once at boot so /version is a constant-time op for monitoring polls.
const PKG_VERSION = process.env.npm_package_version ?? '0.1.0';
const GIT_SHA = process.env.BE_GIT_SHA ?? 'unknown';
const BUILD_TIME = process.env.BE_BUILD_TIME ?? 'unknown';
const BOOT_TIME = new Date().toISOString();

/** Liveness/readiness endpoint for load balancers and container healthchecks. */
@ApiTags('Health')
@Controller('')
export class HealthController {
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', service: 'madinatyai-core-hub', timestamp: new Date().toISOString() };
  }

  /**
   * R-06 — build identity endpoint. Used by the deploy smoke check + by the
   * incident playbook to confirm which build is live. `gitSha` + `buildTime`
   * are injected by CI as env vars; locally they default to "unknown".
   */
  @Public()
  @Get('version')
  version() {
    return {
      service: 'madinatyai-core-hub',
      version: PKG_VERSION,
      gitSha: GIT_SHA,
      buildTime: BUILD_TIME,
      bootTime: BOOT_TIME,
      nodeVersion: process.version,
    };
  }
}
