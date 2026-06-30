import { Module } from '@nestjs/common';
import { PrismaModule } from '@madinatyai/prisma';
import { AiRouterModule } from '@madinatyai/ai-router';
import { TokensModule } from '@madinatyai/tokens';
import { ReportsModule } from '../reports/reports.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SoukElKantoService } from './soukelkanto.service';
import { R2StorageService } from './storage/r2-storage.service';
import { SoukAiSuggestService } from './ai/ai-suggest.service';
import { ListingsController } from './listings/listings.controller';
import { OffersController } from './offers/offers.controller';
import { HandoverController } from './handover/handover.controller';
import { DisputesController } from './disputes/disputes.controller';
import { RatingsController } from './ratings/ratings.controller';
import { FavoritesController } from './favorites/favorites.controller';
import { CategoriesController } from './categories/categories.controller';
import { SafeSpotsController } from './safe-spots/safe-spots.controller';
import { HealthController } from './health/health.controller';
import { SoukAiSuggestionsController } from './ai/ai-suggestions.controller';
import { ContactUsController } from './contact-us/contact-us.controller';

/**
 * Souk ElKanto tenant module — peer-to-peer second-hand marketplace.
 * Provides listings, offers, handover, ratings, favorites, categories,
 * safe meet spots, and AI suggestion endpoints under the
 * `tenant_soukelkanto` schema.
 */
@Module({
  imports: [PrismaModule, AiRouterModule, TokensModule, ReportsModule, NotificationsModule],
  providers: [SoukElKantoService, R2StorageService, SoukAiSuggestService],
  controllers: [
    ListingsController,
    OffersController,
    HandoverController,
    DisputesController,
    RatingsController,
    FavoritesController,
    CategoriesController,
    SafeSpotsController,
    HealthController,
    SoukAiSuggestionsController,
    ContactUsController,
  ],
})
export class SoukElKantoModule {}
