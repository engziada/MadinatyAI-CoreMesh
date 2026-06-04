import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';

/**
 * Cross-platform reporting endpoint. Filing a report:
 *  1) persists an `EcosystemSharedReport` (core schema),
 *  2) emits a cross-platform event to the ledger (best-effort), and
 *  3) recalculates the offender's TrustScore.
 */
@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  @AuditAction({ action: 'report.create', target: 'report' })
  async create(@Body() dto: CreateReportDto) {
    return this.reports.file({
      reporterId: dto.reporterId,
      offenderId: dto.offenderId,
      incidentType: dto.incidentType,
      severity: dto.severity,
      isPlatformWideBanned: dto.isPlatformWideBanned,
      originSubdomain: dto.originSubdomain,
    });
  }
}
