import { Module } from '@nestjs/common';
import { PrismaModule } from '@madinatyai/prisma';
import { TokensService } from './tokens.service';

/**
 * Token wallet module. Provides {@link TokensService} for crediting,
 * spending, allocating, and pricing ecosystem activity tokens.
 */
@Module({
  imports: [PrismaModule],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
