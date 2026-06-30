import { Module, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { configuration, validateEnv, RolesGuard } from '@madinatyai/common';
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
import { ReportsModule } from '../modules/reports/reports.module';
import { TrustMeterModule } from '../modules/trust-meter/trust-meter.module';
import { TenantController } from '../modules/tenant/tenant.controller';
import { TenantItemsService } from '../modules/tenant/tenant-items.service';
import { TokensController } from '../modules/tokens/tokens.controller';
import { BusinessController } from '../modules/business/business.controller';
import { SoukElKantoModule } from '../modules/soukelkanto/soukelkanto.module';
import { AstroModule } from '../modules/astro/astro.module';
import { AuthModule } from '../modules/auth/auth.module';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

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
    process.env.EVENTS_ENABLED === 'false'
      ? EventsModule.forRootDisabled()
      : EventsModule.forRoot(),
    TokensModule,
    BusinessModule,
    AuthModule,
    ReportsModule,
    TrustMeterModule,
    SoukElKantoModule,
    AstroModule,
  ],
  controllers: [
    HealthController,
    AiController,
    UsersController,
    KycController,
    TenantController,
    TokensController,
    BusinessController,
  ],
  providers: [
    TenantItemsService,
    // Global JwtAuthGuard — routes opt out with @Public(). Order matters:
    // JWT must hydrate req.user BEFORE RolesGuard checks req.user.role.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {
  /** Register BusinessMiddleware after TenantMiddleware for sub-subdomain resolution. */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(BusinessMiddleware).forRoutes('business');
  }
}
