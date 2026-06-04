import type { Role } from '@prisma/client';

/**
 * Shape of the authenticated principal hydrated by {@link JwtAuthGuard}
 * onto `request.user`. Downstream guards/decorators read from this contract.
 */
export interface AuthenticatedUser {
  id: string;
  phoneNumber: string;
  role: Role;
}

/**
 * JWT payload contract. Matches what {@link AuthService.issueToken} signs.
 * `sub` is the GlobalUser.id (standard JWT subject claim).
 */
export interface JwtPayload {
  sub: string;
  phoneNumber: string;
  role: Role;
  iat?: number;
  exp?: number;
}
