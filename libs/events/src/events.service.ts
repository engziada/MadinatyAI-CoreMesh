import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CROSS_MATCH_JOB, ECOSYSTEM_EVENTS_QUEUE, EcosystemEvent } from './ecosystem-event.dto';

/**
 * Centralised cross-platform event emitter. Tenant modules call {@link emit}
 * when a noteworthy action occurs; the event is queued in Redis and later
 * persisted to the global `EcosystemCrossMatches` ledger by the processor.
 * Decoupling via a queue keeps tenant request latency low.
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(@InjectQueue(ECOSYSTEM_EVENTS_QUEUE) private readonly queue: Queue) {}

  /** Enqueue a cross-platform ecosystem event for async ledger persistence. */
  async emit(event: EcosystemEvent): Promise<void> {
    await this.queue.add(CROSS_MATCH_JOB, event, {
      removeOnComplete: 1000,
      removeOnFail: 5000,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
    this.logger.debug(`Emitted '${event.eventType}' from '${event.sourceSubdomain}'`);
  }
}
