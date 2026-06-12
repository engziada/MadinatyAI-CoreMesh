import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@madinatyai/prisma';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JtiDenyListService } from '../jti-deny-list.service';
import type { AuthenticatedUser, JwtPayload } from '../types/authenticated-user';

/**
 * Verifies the JWT, looks up the GlobalUser, hydrates
 * `request.user: AuthenticatedUser` and `request.tokenPayload: JwtPayload`.
 * Routes annotated with {@link Public} bypass this guard entirely.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * R-11 F-15 — Token source order
 * ─────────────────────────────────────────────────────────────────────────
 * The guard reads the JWT from, in order:
 *   1. The `madinaty.access` HTTP-only cookie (preferred — XSS-resistant)
 *   2. `Authorization: Bearer <jwt>` header (backward compat for legacy
 *      clients and the existing Playwright test fixtures)
 *
 * The Playwright migration to cookies happens in a separate sub-batch.
 *
 * R-11 F-16 — JTI revocation check
 * ─────────────────────────────────────────────────────────────────────────
 * After a successful signature + expiry check, the guard rejects the
 * request if the JWT's JTI claim has been added to the deny-list (e.g. by
 * a prior /auth/logout call). Tokens minted before the JTI claim existed
 * are unaffected (no jti → no revocation possible — they expire naturally).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    private readonly jtiDenyList: JtiDenyListService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      // express's cookie-parser populates this — typed loosely so the guard
      // doesn't take a hard dependency on its types.
      cookies?: Record<string, string>;
      user?: AuthenticatedUser;
      tokenPayload?: JwtPayload;
    }>();

    const token =
      this.extractFromCookie(request.cookies) ??
      this.extractBearer(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException(
        'Missing auth token (cookie madinaty.access or Authorization: Bearer)',
      );
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch (err) {
      // R-11 F-28 partial: log only the error class name, never the
      // (potentially attacker-controlled) error message.
      this.logger.debug(`JWT verify failed: ${(err as Error).name}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    // R-11 F-16 — revocation check.
    if (payload.jti && this.jtiDenyList.isRevoked(payload.jti)) {
      this.logger.debug(`JWT rejected — jti revoked (sub=${payload.sub})`);
      throw new UnauthorizedException('Token revoked');
    }

    const user = await this.prisma.globalUser.findUnique({
      where: { id: payload.sub },
      select: { id: true, phoneNumber: true, role: true },
    });
    if (!user) {
      throw new UnauthorizedException('Token subject no longer exists');
    }

    request.user = user;
    request.tokenPayload = payload; // /auth/logout needs jti + exp for revoke
    return true;
  }

  private extractBearer(headerValue?: string | string[]): string | undefined {
    const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    if (!raw) return undefined;
    const [scheme, token] = raw.split(' ');
    if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return undefined;
    return token.trim();
  }

  /** R-11 F-15 — prefer the httpOnly cookie. */
  private extractFromCookie(
    cookies?: Record<string, string>,
  ): string | undefined {
    if (!cookies) return undefined;
    const v = cookies['madinaty.access'];
    return v && v.length > 0 ? v : undefined;
  }
}
