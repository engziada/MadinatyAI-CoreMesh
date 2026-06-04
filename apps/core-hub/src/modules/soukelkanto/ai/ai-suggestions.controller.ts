import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantGuard } from '@madinatyai/tenancy';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { SoukAiSuggestService } from './ai-suggest.service';
import { SuggestCategoryDto } from './dto/suggest-category.dto';
import { SuggestPriceDto } from './dto/suggest-price.dto';

/**
 * Souk ElKanto-specific AI helpers — exposed under `/api/v1/ai/*` per the
 * api_contract spec §7. Distinct from the global `AiController` because the
 * prompts and output schemas are kanto-shaped.
 */
@ApiTags('Souk ElKanto — AI Suggestions')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(TenantGuard)
export class SoukAiSuggestionsController {
  constructor(private readonly suggest: SoukAiSuggestService) {}

  @Post('suggest-category')
  @ApiOperation({ summary: 'Top-3 SoukCategory suggestions for a listing title' })
  suggestCategory(@CurrentUser() _user: AuthenticatedUser, @Body() dto: SuggestCategoryDto) {
    return this.suggest.suggestCategory(dto.title, dto.firstPhotoR2Key);
  }

  @Post('suggest-price')
  @ApiOperation({ summary: 'Fair EGP price range based on recent comparables' })
  suggestPrice(@CurrentUser() _user: AuthenticatedUser, @Body() dto: SuggestPriceDto) {
    return this.suggest.suggestPrice({
      title: dto.title,
      category: dto.category,
      condition: dto.condition,
      district: dto.district,
    });
  }
}
