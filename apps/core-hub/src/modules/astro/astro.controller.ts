import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantGuard } from '@madinatyai/tenancy';
import { UseGuards } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { AstroService } from './astro.service';
import { AstroChatDto } from './dto/astro-chat.dto';

/**
 * Astro — Madinaty AI assistant chat endpoint.
 * Public (no auth required) so visitors can chat before logging in.
 */
@ApiTags('Astro — Madinaty AI Assistant')
@Controller('astro')
@UseGuards(TenantGuard)
export class AstroController {
  constructor(private readonly astro: AstroService) {}

  @Public()
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat with Astro (Madinaty AI assistant)' })
  async chat(@Body() dto: AstroChatDto) {
    return this.astro.chat(dto.message, dto.history ?? [], dto.locale);
  }
}
