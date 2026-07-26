import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { LifeLocationType } from '@prisma/client';

/** Create a new location in the Life hierarchy. */
export class CreateLocationDto {
  @ApiProperty({ example: 'Madinaty City' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'مدينتي' })
  @IsString()
  @MinLength(1)
  nameAr!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ example: 30.1234 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 31.5678 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Parent location ID for nesting' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({ enum: LifeLocationType })
  @IsEnum(LifeLocationType)
  type!: LifeLocationType;
}
