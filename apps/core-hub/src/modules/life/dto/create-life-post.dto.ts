import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

/** Create a news post/promotion for a location. */
export class CreateLifePostDto {
  @ApiProperty({ example: 'Summer Sale!' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ example: 'Up to 50% off all items this weekend.' })
  @IsString()
  @MinLength(1)
  content!: string;

  @ApiPropertyOptional({ example: 'https://r2.example.com/post.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
