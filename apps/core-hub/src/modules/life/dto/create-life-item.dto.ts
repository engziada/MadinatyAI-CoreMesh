import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { LifeItemType } from '@prisma/client';

/** Create a catalog/menu item for a location. */
export class CreateLifeItemDto {
  @ApiProperty({ example: 'Coffee' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional({ example: 'قهوة' })
  @IsOptional()
  @IsString()
  titleAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ example: 25.0 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ example: 'https://r2.example.com/item.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'Drinks' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ enum: LifeItemType })
  @IsEnum(LifeItemType)
  type!: LifeItemType;
}
