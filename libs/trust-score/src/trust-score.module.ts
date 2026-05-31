import { Module } from '@nestjs/common';
import { TrustScoreService } from './trust-score.service';

/** Provides the {@link TrustScoreService} reputation engine. */
@Module({
  providers: [TrustScoreService],
  exports: [TrustScoreService],
})
export class TrustScoreModule {}
