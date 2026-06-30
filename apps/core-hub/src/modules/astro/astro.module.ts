import { Module } from '@nestjs/common';
import { PrismaModule } from '@madinatyai/prisma';
import { AstroController } from './astro.controller';
import { AstroService } from './astro.service';

/**
 * Astro module — Madinaty AI assistant (Astro) chat endpoint.
 * Ported from Platform/src/app/api/chat/route.ts and adapted for CoreMesh
 * with Souk ElKanto listings search integration.
 *
 * Requires GROQ_API_KEY. Optional: SERPER_API_KEY (web discovery),
 * WAHA_BASE_URL + WAHA_API_KEY (WhatsApp session initiation).
 */
@Module({
  imports: [PrismaModule],
  providers: [AstroService],
  controllers: [AstroController],
})
export class AstroModule {}
