import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

/**
 * Cross-platform reporting endpoint. Filing a report:
 *  1) persists an `EcosystemSharedReport` (core schema),
 *  2) emits a cross-platform event to the ledger (best-effort), and
 *  3) recalculates the offender's TrustScore.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * R-11 F-05 — Auth hardening
 * ─────────────────────────────────────────────────────────────────────────
 * Before this commit, `reporterId` came from the request body and any
 * authenticated user could spoof reports from any other user. Worse,
 * `isPlatformWideBanned` was also body-supplied — letting an attacker
 * weaponise the TrustScore system to platform-wide-ban arbitrary victims.
 *
 * Now: `reporterId` is bound from the JWT, `isPlatformWideBanned` is
 * removed from the DTO entirely (only PLATFORM_ADMIN tooling — not yet
 * exposed via HTTP — may set that flag), and self-reports are refused.
 */
@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  @AuditAction({ action: 'report.create', target: 'report' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReportDto,
  ) {
    if (dto.offenderId === user.id) {
      throw new ForbiddenException('Cannot report yourself');
    }
    return this.reports.file({
      reporterId: user.id,
      offenderId: dto.offenderId,
      incidentType: dto.incidentType,
      severity: dto.severity,
      // platform-wide-ban is never settable via this user-facing endpoint.
      isPlatformWideBanned: false,
      originSubdomain: dto.originSubdomain,
    });
  }
}
