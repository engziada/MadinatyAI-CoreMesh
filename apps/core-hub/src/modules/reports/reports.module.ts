import { Module } from '@nestjs/common';
import { PrismaModule } from '@madinatyai/prisma';
import { EventsModule } from '@madinatyai/events';
import { TrustScoreModule } from '@madinatyai/trust-score';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

/**
 * Reports module. Exports {@link ReportsService} so tenant modules
 * (e.g. Souk ElKanto) can file reports through the same pipeline as
 * the public POST /reports route.
 */
@Module({
  imports: [PrismaModule, EventsModule, TrustScoreModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
