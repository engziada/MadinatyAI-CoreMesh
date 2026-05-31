import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration, validateEnv } from '@madinatyai/common';
import { PrismaModule } from '@madinatyai/prisma';
import { TenancyModule } from '@madinatyai/tenancy';
import { AiRouterModule } from '@madinatyai/ai-router';
import { KycModule } from '@madinatyai/kyc';
import { TrustScoreModule } from '@madinatyai/trust-score';
import { EventsModule } from '@madinatyai/events';
import { HealthController } from './health.controller';
import { AiController } from '../modules/ai/ai.controller';
import { UsersController } from '../modules/users/users.controller';
import { KycController } from '../modules/kyc/kyc.controller';
import { ReportsController } from '../modules/reports/reports.controller';
import { TenantController } from '../modules/tenant/tenant.controller';
import { TenantItemsService } from '../modules/tenant/tenant-items.service';

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
    PrismaModule,
    TenancyModule,
    AiRouterModule,
    KycModule,
    TrustScoreModule,
    EventsModule,
  ],
  controllers: [
    HealthController,
    AiController,
    UsersController,
    KycController,
    ReportsController,
    TenantController,
  ],
  providers: [TenantItemsService],
})
export class AppModule {}
