import { Module } from '@nestjs/common';
import { PrismaModule } from '@madinatyai/prisma';
import { ExpressService } from './express.service';
import { ExpressController } from './express.controller';
import { ExpressPortalController } from './express-portal.controller';

@Module({
  imports: [PrismaModule],
  providers: [ExpressService],
  controllers: [ExpressController, ExpressPortalController],
  exports: [ExpressService],
})
export class ExpressModule {}
