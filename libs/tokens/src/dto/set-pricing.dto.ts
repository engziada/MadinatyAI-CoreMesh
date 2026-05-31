import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

/** Admin request to set or update activity pricing. */
export class SetPricingDto {
  @IsString()
  @MinLength(1)
  activityType!: string;

  @IsInt()
  @Min(0)
  cost!: number;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
