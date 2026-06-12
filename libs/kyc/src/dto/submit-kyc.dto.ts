import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Request body for submitting a KYC identity document.
 *
 * R-11 F-04: `userId` is intentionally NOT on this DTO. The controller binds
 * the actor from the JWT — without that, any logged-in user could forge an
 * ID for any other userId (the kyc service does an `upsert`, so this would
 * also overwrite the victim's existing KYC).
 */
export class SubmitKycDto {
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  idNumber!: string;

  /** Base64-encoded raw ID document bytes (decrypted only in-memory). */
  @IsString()
  @MinLength(1)
  documentBase64!: string;
}

/** KYC review decision payload. */
export class ReviewKycDto {
  @IsString()
  decision!: 'APPROVE' | 'REJECT';
}
