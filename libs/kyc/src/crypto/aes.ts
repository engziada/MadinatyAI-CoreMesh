import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * AES-256-GCM helpers for encrypting KYC ID documents at rest.
 *
 * Wire format of the produced buffer:
 *   [ 12-byte IV | 16-byte auth tag | ciphertext ]
 * This keeps everything needed for decryption in a single opaque blob that
 * the storage layer can persist without understanding its contents.
 */

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ALGORITHM = 'aes-256-gcm';

/** Parse a 64-char hex key into a 32-byte Buffer, validating length. */
export function parseEncryptionKey(hexKey: string): Buffer {
  if (!hexKey || hexKey.length !== 64) {
    throw new Error('KYC_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hexKey, 'hex');
}

/** Encrypt a plaintext buffer, returning the framed [IV|tag|ciphertext] blob. */
export function encryptBuffer(plaintext: Buffer, key: Buffer): Buffer {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]);
}

/** Decrypt a framed [IV|tag|ciphertext] blob produced by {@link encryptBuffer}. */
export function decryptBuffer(blob: Buffer, key: Buffer): Buffer {
  const iv = blob.subarray(0, IV_LENGTH);
  const authTag = blob.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = blob.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
