import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AiComplexity } from '@madinatyai/common';

/**
 * Payload accepted by the hybrid AI router. `complexity` decides whether the
 * request is served locally (Ollama) or in the cloud (Gemini).
 */
export class AiRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  text!: string;

  @IsEnum(AiComplexity)
  complexity!: AiComplexity;

  /** Optional free-form task hint (e.g. "moderation", "match"). */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  task?: string;
}

/** Normalised response returned by {@link AiRouterService.process}. */
export interface AiRouterResult {
  provider: 'ollama' | 'gemini';
  model: string;
  output: string;
  complexity: AiComplexity;
}
