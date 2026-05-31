import { IsString, MaxLength, MinLength } from 'class-validator';

/** Request body for submitting a KYC identity document. */
export class SubmitKycDto {
  @IsString()
  @MinLength(1)
  userId!: string;

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
