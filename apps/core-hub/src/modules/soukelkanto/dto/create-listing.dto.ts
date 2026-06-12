import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SoukCategory {
  FURNITURE = 'FURNITURE',
  ELECTRONICS = 'ELECTRONICS',
  APPLIANCES = 'APPLIANCES',
  FASHION = 'FASHION',
  KIDS_TOYS = 'KIDS_TOYS',
  KIDS_CLOTHING = 'KIDS_CLOTHING',
  KIDS_GEAR = 'KIDS_GEAR',
  BOOKS_MEDIA = 'BOOKS_MEDIA',
  SPORTS_OUTDOOR = 'SPORTS_OUTDOOR',
  HOME_DECOR = 'HOME_DECOR',
  KITCHEN_DINING = 'KITCHEN_DINING',
  BABY_MATERNITY = 'BABY_MATERNITY',
  MOBILE_TABLETS = 'MOBILE_TABLETS',
  VINTAGE_COLLECTIBLES = 'VINTAGE_COLLECTIBLES',
  MOVING_BUNDLE = 'MOVING_BUNDLE',
  OTHER = 'OTHER',
}

export enum SoukCondition {
  NEW_WITH_TAGS = 'NEW_WITH_TAGS',
  LIKE_NEW = 'LIKE_NEW',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  NEEDS_REPAIR = 'NEEDS_REPAIR',
  FOR_PARTS = 'FOR_PARTS',
}

class ListingPhotoDto {
  @IsString()
  @IsNotEmpty()
  r2Key!: string;

  @IsInt()
  @Min(0)
  position!: number;

  // R-11 F-12: `url` is intentionally NOT accepted from the client. The
  // service derives the canonical URL from r2Key + KANTO_R2_PUBLIC_BASE so
  // an attacker can't reference someone else's photo or an off-host asset.
  // Kept as an optional field on the type to keep older clients compatible
  // — the value, if sent, is overwritten server-side.
  @IsOptional()
  @IsString()
  @MaxLength(512)
  url?: string;
}

export class CreateListingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @IsEnum(SoukCategory)
  category!: SoukCategory;

  @IsEnum(SoukCondition)
  condition!: SoukCondition;

  @IsInt()
  @Min(0)
  askingPrice!: number;

  @IsString()
  @MaxLength(64)
  district!: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ListingPhotoDto)
  photos?: ListingPhotoDto[];
}

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(SoukCategory)
  category?: SoukCategory;

  @IsOptional()
  @IsEnum(SoukCondition)
  condition?: SoukCondition;

  @IsOptional()
  @IsInt()
  @Min(0)
  askingPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  district?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ListingPhotoDto)
  photos?: ListingPhotoDto[];
}
