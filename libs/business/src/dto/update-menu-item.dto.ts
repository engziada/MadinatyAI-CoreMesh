import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

/** Request to update an existing kitchen menu item. */
export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  title?: string;

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
