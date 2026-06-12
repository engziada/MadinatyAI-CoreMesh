import { createHash, randomInt } from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@madinatyai/prisma';
import { RateLimitError } from '@madinatyai/gateway';
import {
  OTP_DELIVERY_PROVIDER,
  type OtpDeliveryProvider,
} from './providers/otp-delivery.provider';

// R-11 F-17 — per-phone OTP issuance throttle thresholds. Backed by counting
// rows in `core.OtpChallenge` so we don't require Redis for v1. Move to
// Redis-backed sliding-window counter when the table grows past ~1M rows.
const OTP_PER_PHONE_MIN_GAP_SECONDS = 60; // 1-per-minute
const OTP_PER_PHONE_HOURLY_CAP = 5;       // 5-per-hour

/**
 * Manages the lifecycle of phone-based one-time passwords:
 *   issue → store hash → deliver → verify → consume.
 *
 * Storage: Postgres `core.OtpChallenge`. TTL enforced via `expiresAt` column
 * (nightly cleanup cron lives elsewhere; expired rows are rejected on verify).
 *
 * Codes are 6 digits, generated with crypto.randomInt (uniform). We store
 * only `sha256(phoneNumber || ':' || code)` so a DB dump doesn't leak codes.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(OTP_DELIVERY_PROVIDER)
    private readonly delivery: OtpDeliveryProvider,
  ) {}

  /**
   * Issue a fresh OTP for `phoneNumber` and dispatch it.
   * Invalidates any prior, still-pending challenge for the same phone
   * to prevent two concurrent codes racing.
   *
   * R-11 F-17 — per-phone throttle: max 1 OTP per 60s, max 5 OTPs per hour.
   * Counts rows already in `core.OtpChallenge`. Returns 429 RateLimitError
   * with a Retry-After hint when exceeded.
   */
  async issue(phoneNumber: string, purpose: 'LOGIN' | 'REGISTER'): Promise<void> {
    await this.enforcePerPhoneThrottle(phoneNumber);

    const ttlSeconds = this.config.get<number>('auth.otpTtlSeconds') ?? 300;
    const code = this.generateCode();
    const codeHash = this.hash(phoneNumber, code);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    // Soft-consume any prior pending challenge for this phone so a user can't
    // race two codes. We mark them consumed with attempts=99 as a sentinel.
    await this.prisma.otpChallenge.updateMany({
      where: { phoneNumber, consumedAt: null, expiresAt: { gt: new Date() } },
      data: { consumedAt: new Date(), attempts: 99 },
    });

    await this.prisma.otpChallenge.create({
      data: { phoneNumber, codeHash, expiresAt, purpose },
    });

    await this.delivery.send(phoneNumber, code);
    this.logger.log(`OTP issued for ${this.maskPhone(phoneNumber)} (${purpose})`);
  }

  /**
   * R-11 F-17 — count recent issuances for the phone and refuse if over the
   * burst cap. Postgres-backed (cheap because the table is row-indexed on
   * `phoneNumber`).
   */
  private async enforcePerPhoneThrottle(phoneNumber: string): Promise<void> {
    const now = Date.now();
    const minGapWindow = new Date(now - OTP_PER_PHONE_MIN_GAP_SECONDS * 1000);
    const hourlyWindow = new Date(now - 3600 * 1000);

    // Single round-trip: count rows in both windows.
    const [recentBurst, hourly] = await Promise.all([
      this.prisma.otpChallenge.count({
        where: { phoneNumber, createdAt: { gt: minGapWindow } },
      }),
      this.prisma.otpChallenge.count({
        where: { phoneNumber, createdAt: { gt: hourlyWindow } },
      }),
    ]);

    if (recentBurst > 0) {
      this.logger.warn(
        `OTP burst-throttle hit for ${this.maskPhone(phoneNumber)}`,
      );
      throw new RateLimitError(OTP_PER_PHONE_MIN_GAP_SECONDS);
    }
    if (hourly >= OTP_PER_PHONE_HOURLY_CAP) {
      this.logger.warn(
        `OTP hourly-cap hit for ${this.maskPhone(phoneNumber)} (${hourly} in last hour)`,
      );
      // Retry-after = remaining seconds until the oldest hourly request ages out.
      throw new RateLimitError(3600);
    }
  }

  /**
   * Verify a submitted OTP. Returns true on success and marks the challenge
   * consumed. Throws `UnauthorizedException` on wrong code, `BadRequestException`
   * on expired/missing.
   *
   * Dev bypass: if `auth.devBypass` is true and `code` matches `auth.devBypassCode`,
   * the verification succeeds without touching the challenge row. Production
   * forces this off via configuration.
   */
  async verify(phoneNumber: string, code: string): Promise<boolean> {
    if (this.isDevBypass(code)) {
      this.logger.warn(`DEV OTP bypass used for ${this.maskPhone(phoneNumber)}`);
      return true;
    }

    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { phoneNumber, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      throw new BadRequestException('No active OTP challenge for this phone.');
    }
    if (challenge.expiresAt < new Date()) {
      throw new BadRequestException('OTP expired. Request a new code.');
    }

    const maxAttempts = this.config.get<number>('auth.otpMaxAttempts') ?? 5;
    if (challenge.attempts >= maxAttempts) {
      // Burn the challenge so further attempts can't even probe.
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });
      throw new UnauthorizedException(
        'Too many attempts. Request a new OTP.',
      );
    }

    const expected = this.hash(phoneNumber, code);
    if (challenge.codeHash !== expected) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: challenge.attempts + 1 },
      });
      throw new UnauthorizedException('Incorrect OTP.');
    }

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });
    return true;
  }

  private generateCode(): string {
    // 0-padded 6-digit string, uniform across [0, 1_000_000).
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private hash(phoneNumber: string, code: string): string {
    return createHash('sha256').update(`${phoneNumber}:${code}`).digest('hex');
  }

  private isDevBypass(code: string): boolean {
    // WAHA takes precedence - never allow dev bypass when WhatsApp OTP is live
    const wahaUrl = this.config.get<string>('waha.baseUrl');
    const wahaKey = this.config.get<string>('waha.apiKey');
    if (wahaUrl && wahaKey) return false;

    const enabled = this.config.get<boolean>('auth.devBypass') ?? false;
    if (!enabled) return false;
    const bypass = this.config.get<string>('auth.devBypassCode') ?? '000000';
    return code === bypass;
  }

  private maskPhone(phoneNumber: string): string {
    if (phoneNumber.length <= 4) return '****';
    return `${phoneNumber.slice(0, 3)}****${phoneNumber.slice(-2)}`;
  }
}
