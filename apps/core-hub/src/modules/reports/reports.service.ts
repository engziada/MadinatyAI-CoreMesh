import { Injectable, Logger } from '@nestjs/common';
import { IncidentType } from '@prisma/client';
import { PrismaService } from '@madinatyai/prisma';
import { EventsService } from '@madinatyai/events';
import { TrustScoreService } from '@madinatyai/trust-score';

export interface FileReportInput {
  reporterId: string;
  offenderId: string;
  incidentType: IncidentType;
  severity: number;
  isPlatformWideBanned?: boolean;
  originSubdomain?: string;
}

/**
 * Cross-platform reporting pipeline used by every tenant. Filing a report:
 *   1) persists an `EcosystemSharedReport` (core schema),
 *   2) emits a best-effort cross-platform event,
 *   3) recalculates the offender's TrustScore.
 *
 * Extracted from ReportsController so other tenant modules (Souk ElKanto,
 * Kitchen, Tutor, ...) can reuse the same logic without coupling controllers.
 */
@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly trust: TrustScoreService,
  ) {}

  async file(input: FileReportInput) {
    const report = await this.prisma.ecosystemSharedReport.create({
      data: {
        reporterId: input.reporterId,
        offenderId: input.offenderId,
        incidentType: input.incidentType,
        severity: input.severity,
        isPlatformWideBanned: input.isPlatformWideBanned ?? false,
        originSubdomain: input.originSubdomain ?? null,
      },
    });

    // Best-effort ledger emission; never block the core flow on the queue.
    try {
      await this.events.emit({
        sourceSubdomain: input.originSubdomain ?? 'core',
        eventType: 'user.reported',
        userId: input.offenderId,
        payload: { severity: input.severity, incidentType: input.incidentType },
      });
    } catch (err) {
      this.logger.warn(`Event emit failed (continuing): ${(err as Error).message}`);
    }

    const trust = await this.trust.recalculate(input.offenderId);
    return { report, trust };
  }
}
