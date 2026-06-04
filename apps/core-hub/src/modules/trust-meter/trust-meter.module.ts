import { Module } from '@nestjs/common';
import { PrismaModule } from '@madinatyai/prisma';
import { TrustMeterController } from './trust-meter.controller';
import { TrustMeterService } from './trust-meter.service';

/**
 * MVP TrustMeter — see {@link TrustMeterService} doc for the shim contract.
 * Will be replaced by the full `@madinatyai/trust-meter` library; the URL
 * surface stays identical so the FE does not change.
 */
@Module({
  imports: [PrismaModule],
  controllers: [TrustMeterController],
  providers: [TrustMeterService],
  exports: [TrustMeterService],
})
export class TrustMeterModule {}
