import { HttpException, HttpStatus, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios, { AxiosInstance } from 'axios';
import { AiComplexity } from '@madinatyai/common';
import { AiRequestDto, AiRouterResult } from './dto/ai-request.dto';

/**
 * Hybrid AI router (Step 3 of the core blueprint).
 *
 * - COMPLEXITY_LOW  -> local Ollama via HTTP (`/api/generate`). Used for
 *   cost-free routine tasks: PII checks, spam/content moderation.
 * - COMPLEXITY_HIGH -> cloud Google Gemini SDK. Used for deep cross-platform
 *   semantic matching and embedding generation.
 *
 * Keeping both behind one service means callers only choose a complexity tier;
 * the routing/cost tradeoff lives here.
 */
@Injectable()
export class AiRouterService {
  private readonly logger = new Logger(AiRouterService.name);
  private readonly http: AxiosInstance;
  private gemini: GoogleGenerativeAI | null = null;

  constructor(private readonly config: ConfigService) {
    this.http = axios.create({
      baseURL: this.config.get<string>('ai.ollamaBaseUrl'),
      timeout: this.config.get<number>('ai.ollamaTimeoutMs') ?? 20000,
    });
  }

  /** Route a request to the correct inference layer based on complexity. */
  async process(req: AiRequestDto): Promise<AiRouterResult> {
    switch (req.complexity) {
      case AiComplexity.COMPLEXITY_LOW:
        return this.runLocal(req.text);
      case AiComplexity.COMPLEXITY_HIGH:
        return this.runCloud(req.text);
      default:
        throw new HttpException('Unsupported complexity', HttpStatus.BAD_REQUEST);
    }
  }

  /** Convenience wrapper for local moderation (always LOW complexity). */
  async moderate(text: string): Promise<AiRouterResult> {
    const prompt =
      'You are a content moderation classifier. Reply with a JSON object ' +
      '{"flagged": boolean, "reason": string} for the following text:\n' +
      text;
    return this.runLocal(prompt);
  }

  /** Local Ollama inference. */
  private async runLocal(prompt: string): Promise<AiRouterResult> {
    const model = this.config.get<string>('ai.ollamaModel') ?? 'llama3:8b';
    try {
      const { data } = await this.http.post('/api/generate', {
        model,
        prompt,
        stream: false,
      });
      return {
        provider: 'ollama',
        model,
        output: (data?.response ?? '').toString(),
        complexity: AiComplexity.COMPLEXITY_LOW,
      };
    } catch (err) {
      this.logger.error(`Ollama request failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Local AI (Ollama) is unavailable');
    }
  }

  /** Cloud Gemini inference. */
  private async runCloud(prompt: string): Promise<AiRouterResult> {
    const client = this.getGemini();
    const modelName = this.config.get<string>('ai.geminiModel') ?? 'gemini-1.5-pro';
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return {
        provider: 'gemini',
        model: modelName,
        output: result.response.text(),
        complexity: AiComplexity.COMPLEXITY_HIGH,
      };
    } catch (err) {
      this.logger.error(`Gemini request failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Cloud AI (Gemini) request failed');
    }
  }

  /**
   * Generate a semantic embedding for cross-platform matching (cloud path).
   * Returns a numeric vector suitable for the pgvector `SemanticProfile`.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const client = this.getGemini();
    const modelName = this.config.get<string>('ai.geminiEmbedModel') ?? 'text-embedding-004';
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (err) {
      this.logger.error(`Gemini embedding failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Cloud AI (Gemini) embedding failed');
    }
  }

  private getGemini(): GoogleGenerativeAI {
    if (this.gemini) return this.gemini;
    const apiKey = this.config.get<string>('ai.geminiApiKey');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'GEMINI_API_KEY is not configured; high-complexity routing is disabled',
      );
    }
    this.gemini = new GoogleGenerativeAI(apiKey);
    return this.gemini;
  }
}
