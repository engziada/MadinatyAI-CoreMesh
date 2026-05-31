import { Module } from '@nestjs/common';
import { AiRouterService } from './ai-router.service';

/** Provides the hybrid {@link AiRouterService} to consuming modules. */
@Module({
  providers: [AiRouterService],
  exports: [AiRouterService],
})
export class AiRouterModule {}
