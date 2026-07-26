import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

/** Add a photo to a location gallery. */
export class AddLifePhotoDto {
  @ApiProperty({ example: 'https://r2.example.com/photo.jpg' })
  @IsString()
  @MinLength(1)
  url!: string;

  @ApiPropertyOptional({ example: 'Front entrance' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  position?: number;
}
