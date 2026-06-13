import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ECOSYSTEM_EVENTS_QUEUE } from './ecosystem-event.dto';
import { EventsProcessor } from './events.processor';
import { EventsService } from './events.service';

/**
 * Configures the Redis (BullMQ) connection and the ecosystem events queue,
 * wiring the emitter ({@link EventsService}) and worker ({@link EventsProcessor}).
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password') || undefined,
          // Upstash + managed Redis endpoints require TLS. Empty options
          // enable it with default cert validation. Local dev Docker Redis
          // stays plain (REDIS_TLS unset/false).
          ...(config.get<boolean>('redis.tls') ? { tls: {} } : {}),
        },
      }),
    }),
    BullModule.registerQueue({ name: ECOSYSTEM_EVENTS_QUEUE }),
  ],
  providers: [EventsService, EventsProcessor],
  exports: [EventsService],
})
export class EventsModule {}
