/**
 * Strategy interface for delivering an OTP to a user (SMS, WhatsApp, console).
 * Implementations are swapped via DI in {@link AuthModule}.
 */
export interface OtpDeliveryProvider {
  /**
   * Deliver `code` to `phoneNumber`. MUST NOT throw on transient delivery
   * failures — log instead. MUST throw on configuration errors (e.g. missing
   * credentials) so the boot fails loud.
   */
  send(phoneNumber: string, code: string): Promise<void>;
}

export const OTP_DELIVERY_PROVIDER = Symbol('OTP_DELIVERY_PROVIDER');
