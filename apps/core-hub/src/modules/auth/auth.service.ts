import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '@madinatyai/prisma';
import { OtpService } from './otp.service';
import type { AuthenticatedUser, JwtPayload } from './types/authenticated-user';

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

  /** Verify the OTP, mint a JWT, return token + user summary. */
  async verifyOtp(
    phoneNumber: string,
    code: string,
  ): Promise<{ token: string; user: AuthenticatedUser }> {
    await this.otp.verify(phoneNumber, code);

    const user = await this.prisma.globalUser.findUnique({
      where: { phoneNumber },
      select: { id: true, phoneNumber: true, role: true },
    });
    if (!user) {
      // Edge case: user was deleted between register & verify.
      throw new NotFoundException('User no longer exists.');
    }

    const token = await this.issueToken(user);
    return { token, user };
  }

  /** Sign a JWT payload for an authenticated user. */
  private async issueToken(user: AuthenticatedUser): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };
    return this.jwt.signAsync(payload, {
      expiresIn: this.config.get<string>('auth.jwtExpiresIn') ?? '7d',
    });
  }

  /** Load the full /me view for an authenticated principal. */
  async me(userId: string) {
    const user = await this.prisma.globalUser.findUnique({
      where: { id: userId },
      include: { kyc: { select: { status: true, reviewedAt: true } } },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isVerified: user.isVerified,
      trustScore: user.trustScore,
      metadata: user.metadata,
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
