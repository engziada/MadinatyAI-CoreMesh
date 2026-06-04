import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { AiRouterService } from '@madinatyai/ai-router';
import { AiComplexity } from '@madinatyai/common';
import { PrismaService } from '@madinatyai/prisma';
import { SoukAiSuggestService } from './ai-suggest.service';
import { SoukCategory, SoukCondition } from '../dto/create-listing.dto';

const makeAi = () => ({ process: jest.fn() });
const makePrisma = () => ({
  soukListing: {
    findMany: jest.fn(),
  },
});

describe('SoukAiSuggestService', () => {
  let service: SoukAiSuggestService;
  let ai: ReturnType<typeof makeAi>;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    ai = makeAi();
    prisma = makePrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoukAiSuggestService,
        { provide: AiRouterService, useValue: ai },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(SoukAiSuggestService);
  });

  describe('suggestCategory', () => {
    it('returns the top-3 parsed suggestions when Ollama responds with JSON', async () => {
      ai.process.mockResolvedValue({
        output:
          'Here is the answer: [{"category":"KIDS_GEAR","confidence":0.92},{"category":"BABY_MATERNITY","confidence":0.71},{"category":"MOVING_BUNDLE","confidence":0.08}] trailing',
      });

      const result = await service.suggestCategory('BabyZen Yoyo stroller');

      expect(ai.process).toHaveBeenCalledWith(
        expect.objectContaining({ complexity: AiComplexity.COMPLEXITY_LOW }),
      );
      expect(result.available).toBe(true);
      expect(result.suggestions).toHaveLength(3);
      expect(result.suggestions[0]).toEqual({
        category: SoukCategory.KIDS_GEAR,
        confidence: 0.92,
      });
    });

    it('caps results at 3 and ignores invalid enum values', async () => {
      ai.process.mockResolvedValue({
        output:
          '[{"category":"KIDS_TOYS","confidence":0.9},{"category":"NOT_A_CATEGORY","confidence":0.8},{"category":"FURNITURE","confidence":0.5},{"category":"OTHER","confidence":0.4}]',
      });
      const result = await service.suggestCategory('Lego classic set');
      expect(result.suggestions.map((s) => s.category)).toEqual([
        SoukCategory.KIDS_TOYS,
        SoukCategory.FURNITURE,
        SoukCategory.OTHER,
      ]);
    });

    it('returns available=false when AI is unhealthy', async () => {
      ai.process.mockRejectedValue(new ServiceUnavailableException('ollama down'));
      const result = await service.suggestCategory('anything');
      expect(result.available).toBe(false);
      expect(result.suggestions).toEqual([]);
      expect(result.reason).toContain('ollama');
    });

    it('returns available=false when output cannot be parsed', async () => {
      ai.process.mockResolvedValue({ output: 'sorry I cannot help' });
      const result = await service.suggestCategory('x');
      expect(result.available).toBe(true);
      expect(result.suggestions).toEqual([]);
    });
  });

  describe('suggestPrice', () => {
    const baseInput = {
      title: 'IKEA crib',
      category: SoukCategory.KIDS_GEAR,
      condition: SoukCondition.LIKE_NEW,
      district: 'B5',
    };

    it('returns available=false when fewer than 3 comparables exist', async () => {
      prisma.soukListing.findMany.mockResolvedValue([{ askingPrice: 1500 }, { askingPrice: 1800 }]);
      const result = await service.suggestPrice(baseInput);
      expect(result.available).toBe(false);
      expect(result.comparablesCount).toBe(2);
    });

    it('returns the comparables-based range without rationale when Gemini fails', async () => {
      const prices = [800, 1000, 1200, 1500, 1800, 2000, 2200, 2500];
      prisma.soukListing.findMany.mockResolvedValue(
        prices.map((p) => ({ askingPrice: p })),
      );
      ai.process.mockRejectedValue(new ServiceUnavailableException('gemini key missing'));

      const result = await service.suggestPrice(baseInput);
      expect(result.available).toBe(true);
      expect(result.suggestedRangeEgp).toBeDefined();
      expect(result.comparablesCount).toBe(8);
      expect(result.rationaleAr).toBeUndefined();
      expect(result.rationaleEn).toBeUndefined();
    });

    it('attaches AR/EN rationale when Gemini answers with JSON', async () => {
      const prices = [800, 1000, 1200, 1500, 1800, 2000, 2200, 2500];
      prisma.soukListing.findMany.mockResolvedValue(
        prices.map((p) => ({ askingPrice: p })),
      );
      ai.process.mockResolvedValue({
        output: '{"ar":"السعر مناسب للحالة","en":"Fair price for this condition"}',
      });

      const result = await service.suggestPrice(baseInput);
      expect(result.available).toBe(true);
      expect(result.rationaleAr).toContain('السعر');
      expect(result.rationaleEn).toContain('Fair');
    });
  });
});
