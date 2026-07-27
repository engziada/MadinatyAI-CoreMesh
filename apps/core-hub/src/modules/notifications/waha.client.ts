import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosInstance } from 'axios';
import https from 'node:https';

/**
 * Shared WAHA (WhatsApp HTTP API) client utility.
 *
 * All WAHA-dependent services (OTP delivery, offer notifications, generic
 * notification channel) extend or delegate to this class to avoid duplicating
 * `toChatId()`, `maskPhone()`, and the HTTP sendText boilerplate.
 *
 * Requires env vars:
 *   WAHA_BASE_URL  - e.g. https://waha.xee.run.place
 *   WAHA_API_KEY   - API key for the WAHA instance
 *   WAHA_SESSION   - session name (default: "default")
 */
export class WahaClient {
  protected readonly logger = new Logger(WahaClient.name);
  private readonly http: AxiosInstance;

  constructor(protected readonly config: ConfigService) {
    const allowSelfSigned =
      config.get<string>('WAHA_ALLOW_SELF_SIGNED') === 'true';
    this.http = axios.create({
      timeout: 10_000,
      httpsAgent: allowSelfSigned
        ? new https.Agent({ rejectUnauthorized: false })
        : undefined,
    });
  }

  /** Returns true if WAHA base URL + API key are configured. */
  isAvailable(): boolean {
    const baseUrl = this.config.get<string>('waha.baseUrl');
    const apiKey = this.config.get<string>('waha.apiKey');
    return Boolean(baseUrl && apiKey);
  }

  /** WAHA session name (defaults to "default"). */
  protected get session(): string {
    return this.config.get<string>('waha.session') ?? 'default';
  }

  /** WAHA base URL (empty string if not configured). */
  protected get baseUrl(): string {
    return this.config.get<string>('waha.baseUrl') ?? '';
  }

  /** WAHA API key (empty string if not configured). */
  protected get apiKey(): string {
    return this.config.get<string>('waha.apiKey') ?? '';
  }

  /**
   * Send a text message via WAHA to a phone number.
   * Returns true on success, false on failure (never throws).
   */
  async sendText(phoneNumber: string, text: string): Promise<boolean> {
    if (!this.isAvailable()) {
      this.logger.debug(
        `WAHA not configured — skipping sendText to ${this.maskPhone(phoneNumber)}`,
      );
      return false;
    }

    const chatId = this.toChatId(phoneNumber);

    try {
      await this.http.post(
        `${this.baseUrl}/api/sendText`,
        { session: this.session, chatId, text },
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `WAHA sendText failed for ${this.maskPhone(phoneNumber)}: ${msg}`,
      );
      return false;
    }
  }

  /**
   * Convert a phone number to WAHA chatId format: <digits>@c.us
   * Strips all non-digit characters.
   */
  toChatId(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, '');
    return `${digits}@c.us`;
  }

  /**
   * Mask a phone number for logging: show first 3 and last 2 digits only.
   */
  maskPhone(phoneNumber: string): string {
    if (phoneNumber.length <= 4) return '****';
    return `${phoneNumber.slice(0, 3)}****${phoneNumber.slice(-2)}`;
  }
}
