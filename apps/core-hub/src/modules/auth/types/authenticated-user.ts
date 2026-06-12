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
 *
 * R-11 F-16 — `jti` is a server-generated random ID per issuance. Stored in
 * the JTI deny-list on logout so subsequent verifies fail even when the token
 * hasn't expired yet.
 */
export interface JwtPayload {
  sub: string;
  phoneNumber: string;
  role: Role;
  jti?: string;
  iat?: number;
  exp?: number;
}
