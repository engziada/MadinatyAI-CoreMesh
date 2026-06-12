import { IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Request to spend tokens on an ecosystem activity.
 *
 * R-11 F-03: `userId` is intentionally NOT on this DTO. The controller binds
 * the actor from the JWT (`@CurrentUser()`) — body-supplied user identity is
 * forbidden because it would allow any logged-in user to spend tokens from
 * any other user's wallet.
 */
export class SpendTokensDto {
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
