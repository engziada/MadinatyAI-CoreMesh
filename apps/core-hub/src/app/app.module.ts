import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration, validateEnv } from '@madinatyai/common';
import { PrismaModule } from '@madinatyai/prisma';
import { TenancyModule } from '@madinatyai/tenancy';
import { AiRouterModule } from '@madinatyai/ai-router';
import { KycModule } from '@madinatyai/kyc';
import { TrustScoreModule } from '@madinatyai/trust-score';
import { EventsModule } from '@madinatyai/events';
import { TokensModule } from '@madinatyai/tokens';
import { BusinessModule, BusinessMiddleware } from '@madinatyai/business';
import { GatewayModule } from '@madinatyai/gateway';
import { HealthController } from './health.controller';
import { AiController } from '../modules/ai/ai.controller';
import { UsersController } from '../modules/users/users.controller';
import { KycController } from '../modules/kyc/kyc.controller';
import { ReportsController } from '../modules/reports/reports.controller';
import { TenantController } from '../modules/tenant/tenant.controller';
import { TenantItemsService } from '../modules/tenant/tenant-items.service';
import { TokensController } from '../modules/tokens/tokens.controller';
import { BusinessController } from '../modules/business/business.controller';
import { SoukElKantoModule } from '../modules/soukelkanto/soukelkanto.module';

/**
 * Root module wiring the shared core (config, Prisma, tenancy) with the
 * ecosystem engines (AI router, KYC, trust score, cross-platform events).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: ['.env'],
    }),
    GatewayModule.forRoot({
      logging: {
        service: 'core-hub',
        env: process.env.APP_ENV ?? 'development',
        level: process.env.LOG_LEVEL ?? 'info',
        logDir: process.env.LOG_DIR ?? './logs',
        disableFile: process.env.LOG_DISABLE_FILE === 'true',
        disableConsole: process.env.LOG_DISABLE_CONSOLE === 'true',
      },
    }),
    PrismaModule,
    TenancyModule,
    AiRouterModule,
    KycModule,
    TrustScoreModule,
    EventsModule,
    TokensModule,
    BusinessModule,
    SoukElKantoModule,
  ],
  controllers: [
    HealthController,
    AiController,
    UsersController,
    KycController,
    ReportsController,
    TenantController,
    TokensController,
    BusinessController,
  ],
  providers: [TenantItemsService],
})
export class AppModule {
  /** Register BusinessMiddleware after TenantMiddleware for sub-subdomain resolution. */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(BusinessMiddleware).forRoutes('business');
  }
}
