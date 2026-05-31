import { IsInt, IsString, Min, MinLength } from 'class-validator';

/** Request to allocate tokens to a specific activity budget. */
export class AllocateTokensDto {
  @IsString()
  @MinLength(1)
  userId!: string;

  @IsString()
  @MinLength(1)
  activityType!: string;

  @IsString()
  @MinLength(1)
  tokenType!: 'business' | 'individual';

  @IsInt()
  @Min(0)
  amount!: number;
}
