import { IsInt, IsString, Min, MinLength } from 'class-validator';

/**
 * Request to allocate tokens to a specific activity budget.
 *
 * R-11 F-03: `userId` is intentionally NOT on this DTO. The controller binds
 * the actor from the JWT.
 */
export class AllocateTokensDto {
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
