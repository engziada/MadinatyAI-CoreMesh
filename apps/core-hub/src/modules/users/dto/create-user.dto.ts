import { IsObject, IsOptional, IsString, Matches } from 'class-validator';

/** Create a shared GlobalUser identity. */
export class CreateUserDto {
  /** E.164-ish phone number (the cross-platform identity anchor). */
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'phoneNumber must be 7-15 digits' })
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  role?: string;

  /**
   * Free-form metadata. May hold raw payment handles (Instapay / Vodafone
   * Cash) as opaque strings only — Transparent Broker policy: no balances.
   */
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
