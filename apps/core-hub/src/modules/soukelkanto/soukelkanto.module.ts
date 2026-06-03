import { Module } from '@nestjs/common';
import { PrismaModule } from '@madinatyai/prisma';
import { AiRouterModule } from '@madinatyai/ai-router';
import { TokensModule } from '@madinatyai/tokens';
import { EventsModule } from '@madinatyai/events';
import { SoukElKantoService } from './soukelkanto.service';
import { ListingsController } from './listings/listings.controller';
import { OffersController } from './offers/offers.controller';
import { HandoverController } from './handover/handover.controller';
import { RatingsController } from './ratings/ratings.controller';
import { FavoritesController } from './favorites/favorites.controller';
import { CategoriesController } from './categories/categories.controller';
import { SafeSpotsController } from './safe-spots/safe-spots.controller';
import { HealthController } from './health/health.controller';

/**
 * Souk ElKanto tenant module — peer-to-peer second-hand marketplace.
 * Provides listings, offers, handover, ratings, favorites, categories,
 * and safe meet spots under the `tenant_soukelkanto` schema.
 */
@Module({
  imports: [PrismaModule, AiRouterModule, TokensModule, EventsModule],
  providers: [SoukElKantoService],
  controllers: [
    ListingsController,
    OffersController,
    HandoverController,
    RatingsController,
    FavoritesController,
    CategoriesController,
    SafeSpotsController,
    HealthController,
  ],
})
export class SoukElKantoModule {}
