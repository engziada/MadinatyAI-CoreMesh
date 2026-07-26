import { IsBoolean, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

/** Request to create a new kitchen menu item. */
export class CreateMenuItemDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsString()
  scheduleType?: string; // "MORNING" | "EVENING" | "ALL_DAY"
}
