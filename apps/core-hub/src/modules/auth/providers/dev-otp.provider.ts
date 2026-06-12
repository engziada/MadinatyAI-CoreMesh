import { Injectable, Logger } from '@nestjs/common';
import type { OtpDeliveryProvider } from './otp-delivery.provider';

/**
 * Dev provider — prints the OTP to the server console with a banner so it's
 * easy to grab in local dev / e2e. Also keeps the most recent code per phone
 * in memory so tests can retrieve it without scraping logs.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * R-11 F-18 — refuses to ship in production
 * ─────────────────────────────────────────────────────────────────────────
 * Before this commit, if the AuthModule factory's NODE_ENV-based swap
 * silently fell back to this provider (e.g. because WAHA_BASE_URL was empty
 * due to a Fly secrets misconfiguration), every OTP would have been written
 * to the server log as plaintext PII. The send() method now throws when
 * NODE_ENV === 'production' — fail-loud rather than fail-silently-leak.
 */
@Injectable()
export class DevOtpDeliveryProvider implements OtpDeliveryProvider {
  private readonly logger = new Logger(DevOtpDeliveryProvider.name);
  private readonly lastByPhone = new Map<string, string>();

  async send(phoneNumber: string, code: string): Promise<void> {
    // R-11 F-18: production safety guard. The factory should never wire this
    // provider in prod, but if it does (misconfig, dependency upgrade,
    // refactor regression), we'd rather crash the OTP send than log raw codes.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'DevOtpDeliveryProvider refused to send in production. ' +
          'Configure WAHA_BASE_URL/API_KEY or a real SMS provider.',
      );
    }
    this.lastByPhone.set(phoneNumber, code);
    // Loud banner so the OTP is impossible to miss while developing.
    this.logger.log(
      `\n────────── OTP (DEV) ──────────\n  phone: ${phoneNumber}\n  code : ${code}\n────────────────────────────────`,
    );
  }

  /** Test/dev helper — returns the most recent OTP delivered to `phoneNumber`. */
  peek(phoneNumber: string): string | undefined {
    return this.lastByPhone.get(phoneNumber);
  }
}
