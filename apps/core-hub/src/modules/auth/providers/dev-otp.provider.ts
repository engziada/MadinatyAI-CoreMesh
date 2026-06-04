import { Injectable, Logger } from '@nestjs/common';
import type { OtpDeliveryProvider } from './otp-delivery.provider';

/**
 * Dev provider — prints the OTP to the server console with a banner so it's
 * easy to grab in local dev / e2e. Also keeps the most recent code per phone
 * in memory so tests can retrieve it without scraping logs.
 *
 * NEVER use in production. The {@link AuthModule} factory swaps this out
 * when NODE_ENV=production.
 */
@Injectable()
export class DevOtpDeliveryProvider implements OtpDeliveryProvider {
  private readonly logger = new Logger(DevOtpDeliveryProvider.name);
  private readonly lastByPhone = new Map<string, string>();

  async send(phoneNumber: string, code: string): Promise<void> {
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
