import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { OtpDeliveryProvider } from './otp-delivery.provider';

/**
 * Production stub — fails loudly so we never ship "OTP not delivered" to users.
 * Replace this with a real provider (Vonage / Twilio / a local Egyptian SMS
 * gateway) when going live.
 */
@Injectable()
export class StubSmsOtpDeliveryProvider implements OtpDeliveryProvider {
  private readonly logger = new Logger(StubSmsOtpDeliveryProvider.name);

  async send(phoneNumber: string, _code: string): Promise<void> {
    this.logger.error(
      `SMS provider not configured — refusing to silently drop OTP for ${phoneNumber}.`,
    );
    throw new ServiceUnavailableException(
      'OTP delivery is not configured. Wire a real SMS provider before going live.',
    );
  }
}
