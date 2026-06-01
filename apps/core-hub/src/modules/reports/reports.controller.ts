import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { PrismaService } from '@madinatyai/prisma';
import { EventsService } from '@madinatyai/events';
import { TrustScoreService } from '@madinatyai/trust-score';
import { CreateReportDto } from './dto/create-report.dto';

/**
 * Cross-platform reporting endpoint. Filing a report:
 *  1) persists an `EcosystemSharedReport` (core schema),
 *  2) emits a cross-platform event to the ledger (best-effort), and
 *  3) recalculates the offender's TrustScore.
 */
@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly trust: TrustScoreService,
  ) {}

  @Post()
  @AuditAction({ action: 'report.create', target: 'report' })
  async create(@Body() dto: CreateReportDto) {
    const report = await this.prisma.ecosystemSharedReport.create({
      data: {
        reporterId: dto.reporterId,
        offenderId: dto.offenderId,
        incidentType: dto.incidentType,
        severity: dto.severity,
        isPlatformWideBanned: dto.isPlatformWideBanned ?? false,
        originSubdomain: dto.originSubdomain ?? null,
      },
    });

    // Best-effort ledger emission; never block the core flow on the queue.
    try {
      await this.events.emit({
        sourceSubdomain: dto.originSubdomain ?? 'core',
        eventType: 'user.reported',
        userId: dto.offenderId,
        payload: { severity: dto.severity, incidentType: dto.incidentType },
      });
    } catch (err) {
      this.logger.warn(`Event emit failed (continuing): ${(err as Error).message}`);
    }

    const trust = await this.trust.recalculate(dto.offenderId);
    return { report, trust };
  }
}
