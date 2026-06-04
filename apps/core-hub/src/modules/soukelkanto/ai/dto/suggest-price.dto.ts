import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { SoukCategory, SoukCondition } from '../../dto/create-listing.dto';

export class SuggestPriceDto {
  @ApiProperty({ example: 'IKEA Hemnes crib, like new' })
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiProperty({ enum: SoukCategory })
  @IsEnum(SoukCategory)
  category!: SoukCategory;

  @ApiProperty({ enum: SoukCondition })
  @IsEnum(SoukCondition)
  condition!: SoukCondition;

  @ApiProperty({ example: 'B5' })
  @IsString()
  @MaxLength(64)
  district!: string;

  @ApiProperty({ required: false, type: [String], example: ['uploads/u-1/2026-06-04/a.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}

export interface SuggestPriceResponse {
  available: boolean;
  suggestedRangeEgp?: { min: number; median: number; max: number };
  comparablesCount?: number;
  rationaleAr?: string;
  rationaleEn?: string;
  reason?: string;
}
