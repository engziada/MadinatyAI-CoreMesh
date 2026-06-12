import { IsJSON, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Request to register a new business within a tenant.
 *
 * R-11 F-06: `ownerGlobalUserId` is intentionally NOT on this DTO. The
 * controller binds the owner from the JWT and passes it as a separate arg
 * to `BusinessService.createBusiness(tenant, ownerGlobalUserId, dto)`.
 */
export class CreateBusinessDto {
  @IsString()
  @MinLength(1)
  slug!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsJSON()
  branding?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  cuisineType?: string;

  @IsOptional()
  @IsString()
  subjects?: string; // JSON string of string[] for tutor

  @IsOptional()
  @IsString()
  qualifications?: string;

  @IsOptional()
  address?: string;

  @IsOptional()
  phone?: string;
}
