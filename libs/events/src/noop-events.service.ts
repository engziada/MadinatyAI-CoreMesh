import { Injectable, Logger } from '@nestjs/common';
import { EcosystemEvent } from './ecosystem-event.dto';

/**
 * No-op replacement for {@link EventsService} when Redis/BullMQ is disabled.
 * Silently discards all events — used when `EVENTS_ENABLED=false` to avoid
 * Redis connection costs on managed Redis with command limits (e.g. Upstash free tier).
 */
@Injectable()
export class NoopEventsService {
  private readonly logger = new Logger(NoopEventsService.name);

  async emit(_event: EcosystemEvent): Promise<void> {
    // Intentionally empty — events are discarded.
  }
}
