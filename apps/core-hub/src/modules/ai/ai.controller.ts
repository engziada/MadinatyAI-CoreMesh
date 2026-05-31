import { Body, Controller, Post } from '@nestjs/common';
import { AiRequestDto, AiRouterService } from '@madinatyai/ai-router';

/** Exposes the hybrid AI router (local Ollama / cloud Gemini). */
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiRouterService) {}

  /** Route arbitrary text by complexity tier. */
  @Post('process')
  process(@Body() dto: AiRequestDto) {
    return this.ai.process(dto);
  }

  /** Convenience: local moderation classifier (always low complexity). */
  @Post('moderate')
  moderate(@Body('text') text: string) {
    return this.ai.moderate(text);
  }
}
