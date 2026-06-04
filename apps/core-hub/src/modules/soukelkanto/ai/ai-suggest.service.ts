import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { AiRouterService } from '@madinatyai/ai-router';
import { AiComplexity } from '@madinatyai/common';
import { PrismaService } from '@madinatyai/prisma';
import { SoukCategory, SoukCondition } from '../dto/create-listing.dto';
import type { SuggestCategoryResponse } from './dto/suggest-category.dto';
import type { SuggestPriceResponse } from './dto/suggest-price.dto';

/**
 * AI-assisted seller-help endpoints for Souk ElKanto.
 *
 * Both methods are best-effort and ALWAYS return a defined shape — when the
 * underlying provider (Ollama / Gemini) is unhealthy, the FE receives
 * `{ available: false, reason }` instead of a 5xx so the suggestion chip
 * can be hidden silently. The doc spec calls this out: "FE should hide the
 * suggestion chip silently" (api_contract §7).
 */
@Injectable()
export class SoukAiSuggestService {
  private readonly logger = new Logger(SoukAiSuggestService.name);

  constructor(
    private readonly ai: AiRouterService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Map a listing title (+ optional photo hint) to the top 3 SoukCategory
   * values. Powered by local Ollama (LOW complexity) — free + fast.
   */
  async suggestCategory(
    title: string,
    firstPhotoR2Key?: string,
  ): Promise<SuggestCategoryResponse> {
    const prompt = this.buildCategoryPrompt(title, firstPhotoR2Key);
    try {
      const result = await this.ai.process({
        complexity: AiComplexity.COMPLEXITY_LOW,
        text: prompt,
      });
      const suggestions = this.parseCategorySuggestions(result.output);
      return { available: true, suggestions };
    } catch (err) {
      const reason = err instanceof ServiceUnavailableException ? err.message : 'AI error';
      this.logger.warn(`suggestCategory degraded: ${reason}`);
      return { available: false, suggestions: [], reason };
    }
  }

  /**
   * Suggest a fair EGP price range. Uses recent comparable listings from the
   * same category/condition as the anchor, then optionally asks Gemini for a
   * polished rationale. If Gemini is unavailable, returns the comparables-only
   * range with no rationale.
   */
  async suggestPrice(input: {
    title: string;
    category: SoukCategory;
    condition: SoukCondition;
    district: string;
  }): Promise<SuggestPriceResponse> {
    // 1) Pull comparables from the tenant schema (same category + condition,
    //    last 90 days, ACTIVE or SOLD). Stable regardless of AI health.
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const comparables = await this.prisma.soukListing.findMany({
      where: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category: input.category as unknown as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        condition: input.condition as unknown as any,
        createdAt: { gte: since },
        status: { in: ['ACTIVE', 'SOLD', 'RESERVED'] },
      },
      select: { askingPrice: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (comparables.length < 3) {
      return {
        available: false,
        comparablesCount: comparables.length,
        reason: 'Not enough comparable listings yet.',
      };
    }

    const prices = comparables
      .map((c) => c.askingPrice)
      .sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    const p25 = prices[Math.floor(prices.length * 0.25)];
    const p75 = prices[Math.floor(prices.length * 0.75)];

    // 2) Optional rationale via Gemini. If it fails, return the data we have.
    let rationaleAr: string | undefined;
    let rationaleEn: string | undefined;
    try {
      const prompt = this.buildPriceRationalePrompt(input, {
        min: p25,
        median,
        max: p75,
        n: comparables.length,
      });
      const result = await this.ai.process({
        complexity: AiComplexity.COMPLEXITY_HIGH,
        text: prompt,
      });
      const parsed = this.parsePriceRationale(result.output);
      rationaleAr = parsed.ar;
      rationaleEn = parsed.en;
    } catch (err) {
      this.logger.warn(`suggestPrice rationale degraded: ${(err as Error).message}`);
    }

    return {
      available: true,
      suggestedRangeEgp: { min: p25, median, max: p75 },
      comparablesCount: comparables.length,
      rationaleAr,
      rationaleEn,
    };
  }

  // ────────────────────────── helpers ──────────────────────────

  private buildCategoryPrompt(title: string, photoKey?: string): string {
    const cats = Object.values(SoukCategory).join(' | ');
    return [
      'You are a marketplace category classifier for Souk ElKanto.',
      `Available categories: ${cats}`,
      'Given a listing title (and optional photo key reference), reply with ONLY a JSON array',
      'of up to 3 objects: [{"category":"<ENUM>","confidence":0.0-1.0}, ...].',
      'No prose, no markdown fences.',
      '',
      `Title: ${title}`,
      photoKey ? `PhotoHint: ${photoKey}` : '',
    ].join('\n');
  }

  private parseCategorySuggestions(
    raw: string,
  ): Array<{ category: SoukCategory; confidence: number }> {
    // Tolerate junk around the JSON — find first '[' and last ']'.
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start < 0 || end <= start) return [];
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.slice(start, end + 1));
    } catch {
      return [];
    }
    if (!Array.isArray(parsed)) return [];
    const valid = new Set<string>(Object.values(SoukCategory));
    const result: Array<{ category: SoukCategory; confidence: number }> = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const obj = item as Record<string, unknown>;
      const category = typeof obj.category === 'string' ? obj.category : undefined;
      const confidence = typeof obj.confidence === 'number' ? obj.confidence : 0;
      if (category && valid.has(category) && result.length < 3) {
        result.push({ category: category as SoukCategory, confidence });
      }
    }
    return result;
  }

  private buildPriceRationalePrompt(
    input: { title: string; category: SoukCategory; condition: SoukCondition; district: string },
    stats: { min: number; median: number; max: number; n: number },
  ): string {
    return [
      'You explain a price range to a Madinaty resident in a friendly, concise tone.',
      'Reply with ONLY a JSON object: {"ar":"...","en":"..."}.',
      'Each rationale should be 1-2 sentences, no markdown.',
      '',
      `Item: ${input.title} (category=${input.category}, condition=${input.condition}, district=${input.district})`,
      `Comparable listings (last 90 days, n=${stats.n}): p25=${stats.min} EGP, median=${stats.median} EGP, p75=${stats.max} EGP.`,
    ].join('\n');
  }

  private parsePriceRationale(raw: string): { ar?: string; en?: string } {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) return {};
    try {
      const parsed = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
      const ar = typeof parsed.ar === 'string' ? parsed.ar : undefined;
      const en = typeof parsed.en === 'string' ? parsed.en : undefined;
      return { ar, en };
    } catch {
      return {};
    }
  }
}
