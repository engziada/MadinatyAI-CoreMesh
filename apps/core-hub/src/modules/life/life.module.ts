import { Module } from '@nestjs/common';
import { PrismaModule } from '@madinatyai/prisma';
import { MadintyLifeService } from './life.service';
import { MadintyLifeController } from './life.controller';

@Module({
  imports: [PrismaModule],
  providers: [MadintyLifeService],
  controllers: [MadintyLifeController],
  exports: [MadintyLifeService],
})
export class LifeModule {}
