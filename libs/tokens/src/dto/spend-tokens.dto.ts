import { IsOptional, IsString, MinLength } from 'class-validator';

/** Request to spend tokens on an ecosystem activity. */
export class SpendTokensDto {
  @IsString()
  @MinLength(1)
  userId!: string;

  @IsString()
  @MinLength(1)
  activityType!: string;

  @IsString()
  @MinLength(1)
  tokenType!: 'business' | 'individual';

  @IsOptional()
  @IsString()
  referenceId?: string;
}
