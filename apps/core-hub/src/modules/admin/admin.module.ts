import { Module } from '@nestjs/common';
import { PrismaModule } from '@madinatyai/prisma';
import { EcosystemAdminService } from './admin.service';
import { EcosystemAdminController } from './admin.controller';
import { SoukAdminPortalController } from './admin-portal.controller';

@Module({
  imports: [PrismaModule],
  providers: [EcosystemAdminService],
  controllers: [EcosystemAdminController, SoukAdminPortalController],
})
export class AdminModule {}
