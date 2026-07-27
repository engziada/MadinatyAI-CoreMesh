import { randomUUID } from 'node:crypto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '@madinatyai/prisma';
import { OtpService } from './otp.service';
import { JtiDenyListService } from './jti-deny-list.service';
import type { AuthenticatedUser, JwtPayload, UserProfile } from './types/authenticated-user';

/**
 * R-11 F-15 — cookie config produced by `verifyOtp` so the controller can
 * set the HTTP-only cookie. `maxAgeSeconds` mirrors the JWT's exp claim so
 * the cookie expires in lockstep with the token.
 */
export interface AuthCookieDescriptor {
  name: string;
  value: string;
  maxAgeSeconds: number;
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  domain?: string;
}

const AUTH_COOKIE_NAME = 'madinaty.access';
/** Path scope: cookie is sent for all paths so the FE rewrite proxy receives it. */
const AUTH_COOKIE_PATH = '/';

/**
 * Phone + OTP auth. No passwords, no email — matches GlobalUser identity
 * model (phoneNumber-keyed) and the Egyptian residential UX norm.
 *
 * Flow:
 *   POST /auth/register { phoneNumber }       → upserts GlobalUser + issues OTP
 *   POST /auth/login    { phoneNumber }       → re-issues OTP for existing user
 *   POST /auth/verify-otp { phoneNumber, code } → returns { token, user }
 *   GET  /auth/me                              → current user (JwtAuthGuard)
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly otp: OtpService,
    private readonly config: ConfigService,
    // R-11 F-16 — deny-list is consulted on every JWT verify; this service is
    // module-singleton so revoke() + isRevoked() share state.
    private readonly jtiDenyList: JtiDenyListService,
  ) {}

  /** Create a GlobalUser if absent, then dispatch a REGISTER OTP. */
  async register(phoneNumber: string): Promise<{ phoneNumber: string }> {
    const existing = await this.prisma.globalUser.findUnique({
      where: { phoneNumber },
      select: { id: true },
    });

    if (!existing) {
      await this.prisma.globalUser.create({
        data: { phoneNumber, role: Role.USER },
      });
      this.logger.log(`Registered new GlobalUser for ${this.maskPhone(phoneNumber)}`);
    }

    await this.otp.issue(phoneNumber, 'REGISTER');
    return { phoneNumber };
  }

  /** Re-issue an OTP for an existing user. */
  async login(phoneNumber: string): Promise<{ phoneNumber: string }> {
    const user = await this.prisma.globalUser.findUnique({
      where: { phoneNumber },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException(
        'No account for this phone. Use /auth/register first.',
      );
    }
    await this.otp.issue(phoneNumber, 'LOGIN');
    return { phoneNumber };
  }

  /**
   * Verify the OTP, mint a JWT, return token + user summary + cookie
   * descriptor.
   *
   * R-11 F-15 — `cookie` is the HTTP-only Set-Cookie descriptor the
   * controller writes to the response. Body still carries `token` for
   * backward compat with existing FE / Playwright code; new clients SHOULD
   * rely on the cookie and ignore the body token.
   */
  async verifyOtp(
    phoneNumber: string,
    code: string,
  ): Promise<{ token: string; user: UserProfile; cookie: AuthCookieDescriptor }> {
    await this.otp.verify(phoneNumber, code);

    const minimal = await this.prisma.globalUser.findUnique({
      where: { phoneNumber },
      select: { id: true, phoneNumber: true, role: true },
    });
    if (!minimal) {
      // Edge case: user was deleted between register & verify.
      throw new NotFoundException('User no longer exists.');
    }

    const { token, maxAgeSeconds } = await this.issueToken(minimal);
    const cookie = this.describeAuthCookie(token, maxAgeSeconds);
    // Return the full profile projection so clients can hydrate without a
    // follow-up GET /auth/me (Pre-Phase A — profile persistence fix).
    const user = await this.loadUserProfile(minimal.id);
    return { token, user, cookie };
  }

  /**
   * R-11 F-16 — revoke a JWT by adding its JTI to the deny-list. The deny-list
   * holds the entry until the JWT's `exp` would have rejected it anyway.
   * Returns silently when `jti` is absent (older tokens without the claim) —
   * the caller may still want to clear the cookie regardless.
   */
  revokeToken(jti: string | undefined, expSecondsFromEpoch: number | undefined): void {
    if (!jti || !expSecondsFromEpoch) return;
    this.jtiDenyList.revoke(jti, expSecondsFromEpoch);
  }

  /**
   * R-11 F-15 — describe the cookie shape the controller should set. Pulled
   * out so the same logic is reused for both /verify-otp and any future
   * cookie refresh endpoint.
   */
  describeAuthCookie(token: string, maxAgeSeconds: number): AuthCookieDescriptor {
    const isProd = this.config.get<string>('nodeEnv') === 'production';
    // In dev: domain=localhost so the cookie is shared across all ports (SSO).
    // In prod: domain=.madinatyai.com so the cookie is shared across all subdomains.
    const cookieDomain = this.config.get<string>('auth.cookieDomain')
      ?? (isProd ? '.madinatyai.com' : 'localhost');
    return {
      name: AUTH_COOKIE_NAME,
      value: token,
      maxAgeSeconds,
      httpOnly: true,
      // Production: SameSite=Lax + Secure (same-site subdomains, HTTPS).
      // Dev: SameSite=Lax (localhost cross-port, no TLS needed).
      secure: isProd,
      sameSite: 'lax',
      path: AUTH_COOKIE_PATH,
      domain: cookieDomain,
    };
  }

  /** A matching "delete the cookie" descriptor for /auth/logout. */
  describeAuthCookieDelete(): AuthCookieDescriptor {
    return {
      ...this.describeAuthCookie('', 0),
      maxAgeSeconds: 0,
    };
  }

  /** Sign a JWT payload for an authenticated user. */
  private async issueToken(
    user: AuthenticatedUser,
  ): Promise<{ token: string; maxAgeSeconds: number }> {
    const expiresIn = this.config.get<string>('auth.jwtExpiresIn') ?? '24h';
    const payload: JwtPayload = {
      sub: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
      // R-11 F-16 — random per-issuance ID consulted by JwtAuthGuard.
      jti: randomUUID(),
    };
    const token = await this.jwt.signAsync(payload, { expiresIn });
    return { token, maxAgeSeconds: parseExpiresInSeconds(expiresIn) };
  }

  /** Load the full /me view for an authenticated principal. */
  async me(userId: string): Promise<UserProfile> {
    return this.loadUserProfile(userId);
  }

  /**
   * Portal access control — checks if a user can access a portal's management side.
   *
   * PLATFORM_ADMIN bypasses all checks.
   * TENANT_ADMIN / PROVIDER → allowed on kitchen, express, life management.
   * USER → only allowed on express if they have an approved ExpressCourier record.
   *
   * Customer-facing routes (Bas Douk ordering, Life public browsing) are handled
   * on the FE side — they don't call this endpoint.
   */
  async checkPortalAccess(userId: string, role: Role, portal: string): Promise<boolean> {
    if (role === Role.PLATFORM_ADMIN) return true;

    const managementAccess: Record<string, Role[]> = {
      admin: [Role.PLATFORM_ADMIN],
      kitchen: [Role.TENANT_ADMIN, Role.PROVIDER],
      express: [Role.TENANT_ADMIN, Role.PROVIDER],
      life: [Role.TENANT_ADMIN, Role.PROVIDER],
    };

    const allowed = managementAccess[portal];
    if (!allowed) return false;
    if (allowed.includes(role)) return true;

    // USER role: only allowed on express if they're an approved courier
    if (role === Role.USER && portal === 'express') {
      const courier = await this.prisma.expressCourier.findUnique({
        where: { userId },
        select: { status: true },
      });
      return courier?.status === 'APPROVED';
    }

    return false;
  }

  /**
   * Fetch a GlobalUser with KYC and flatten `metadata` into top-level fields.
   * Shared by `/auth/verify-otp` and `/auth/me` so both return the same
   * profile projection (Pre-Phase A — profile persistence fix).
   */
  private async loadUserProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.globalUser.findUnique({
      where: { id: userId },
      include: { kyc: { select: { status: true, reviewedAt: true } } },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const meta = user.metadata as Record<string, unknown> | undefined;
    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isVerified: user.isVerified,
      trustScore: user.trustScore,
      metadata: user.metadata,
      fullName: meta?.fullName as string | undefined,
      gender: meta?.gender as string | undefined,
      birthdate: meta?.birthdate as string | undefined,
      address: meta?.address as string | undefined,
      madinatyGroup: meta?.madinatyGroup as string | undefined,
      buildingNo: meta?.buildingNo as string | undefined,
      aptNo: meta?.aptNo as string | undefined,
      kyc: user.kyc
        ? { status: user.kyc.status, reviewedAt: user.kyc.reviewedAt }
        : null,
      createdAt: user.createdAt,
    };
  }

  private maskPhone(phoneNumber: string): string {
    if (phoneNumber.length <= 4) return '****';
    return `${phoneNumber.slice(0, 3)}****${phoneNumber.slice(-2)}`;
  }
}

/**
 * Parse a JWT `expiresIn` string (e.g. "24h", "30m", "7d", "300s", "300") into
 * a number of seconds. Mirrors the small subset of @nestjs/jwt's syntax that
 * we actually use. Defaults to 24h if the input is unparseable.
 */
function parseExpiresInSeconds(expiresIn: string): number {
  const match = /^(\d+)([smhd]?)$/.exec(expiresIn.trim());
  if (!match) return 24 * 3600;
  const n = Number(match[1]);
  const unit = match[2] || 's';
  switch (unit) {
    case 's': return n;
    case 'm': return n * 60;
    case 'h': return n * 3600;
    case 'd': return n * 86400;
    default:  return 24 * 3600;
  }
}
