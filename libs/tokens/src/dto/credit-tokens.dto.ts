import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

/** Admin request to credit tokens to a user's wallet. */
export class CreditTokensDto {
  @IsString()
  @MinLength(1)
  userId!: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsString()
  @MinLength(1)
  tokenType!: 'business' | 'individual';

  @IsOptional()
  @IsString()
  reason?: string;
}
