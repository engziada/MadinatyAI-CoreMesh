import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ECOSYSTEM_EVENTS_QUEUE } from './ecosystem-event.dto';
import { EventsProcessor } from './events.processor';
import { EventsService } from './events.service';
import { NoopEventsService } from './noop-events.service';

/**
 * Configures the Redis (BullMQ) connection and the ecosystem events queue,
 * wiring the emitter ({@link EventsService}) and worker ({@link EventsProcessor}).
 *
 * When `EVENTS_ENABLED=false`, BullMQ is skipped entirely and a no-op
 * {@link NoopEventsService} is provided instead — zero Redis connections.
 * Use this on managed Redis with command limits (e.g. Upstash free tier).
 *
 * Call {@link forRoot} once in AppModule; the module is @Global so
 * tenant modules inject EventsService without importing it.
 */
@Global()
@Module({})
export class EventsModule {
  static forRoot(): DynamicModule {
    return {
      module: EventsModule,
      imports: [
        ConfigModule,
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            connection: {
              host: config.get<string>('redis.host'),
              port: config.get<number>('redis.port'),
              password: config.get<string>('redis.password') || undefined,
              ...(config.get<boolean>('redis.tls') ? { tls: {} } : {}),
            },
          }),
        }),
        BullModule.registerQueue({ name: ECOSYSTEM_EVENTS_QUEUE }),
      ],
      providers: [EventsService, EventsProcessor],
      exports: [EventsService],
    };
  }

  static forRootDisabled(): DynamicModule {
    return {
      module: EventsModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: EventsService,
          useFactory: () => new NoopEventsService() as unknown as EventsService,
        },
      ],
      exports: [EventsService],
    };
  }
}
