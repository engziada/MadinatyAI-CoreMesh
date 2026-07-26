import { IsOptional, IsString } from 'class-validator';

/** Request to update a business's profile information. */
export class UpdateBusinessProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  cuisineType?: string;

  @IsOptional()
  @IsString()
  subjects?: string;

  @IsOptional()
  @IsString()
  qualifications?: string;

  @IsOptional()
  address?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  openingHours?: Record<string, unknown>;
}
