import { Module } from '@nestjs/common';
import { PrismaModule } from '@madinatyai/prisma';
import { ExpressService } from './express.service';
import { ExpressController } from './express.controller';
@Module({
  imports: [PrismaModule],
  providers: [ExpressService],
  controllers: [ExpressController],
  exports: [ExpressService],
})
export class ExpressModule {}
