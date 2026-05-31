import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@madinatyai/prisma';
import { ECOSYSTEM_EVENTS_QUEUE, EcosystemEvent } from './ecosystem-event.dto';

/**
 * Worker that drains the ecosystem events queue and appends each event to the
 * global `EcosystemCrossMatches` ledger (core schema) for analytics reports.
 */
@Processor(ECOSYSTEM_EVENTS_QUEUE)
export class EventsProcessor extends WorkerHost {
  private readonly logger = new Logger(EventsProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<EcosystemEvent>): Promise<void> {
    const { sourceSubdomain, eventType, userId, payload } = job.data;
    await this.prisma.ecosystemCrossMatches.create({
      data: {
        sourceSubdomain,
        eventType,
        userId: userId ?? null,
        payload: (payload ?? {}) as object,
      },
    });
    this.logger.debug(`Ledger += ${eventType} (${sourceSubdomain})`);
  }
}
