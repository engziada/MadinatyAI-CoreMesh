import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { SoukCategory } from '../../dto/create-listing.dto';

export class SuggestCategoryDto {
  @ApiProperty({ example: 'BabyZen Yoyo stroller, gray, very good condition' })
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiProperty({
    required: false,
    description: 'Optional R2 key of the first photo — helps the AI disambiguate.',
  })
  @IsOptional()
  @IsString()
  firstPhotoR2Key?: string;
}

export interface SuggestCategoryResponse {
  available: boolean;
  suggestions: Array<{ category: SoukCategory; confidence: number }>;
  reason?: string;
}
