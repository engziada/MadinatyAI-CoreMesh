import { randomBytes } from 'node:crypto';
import { decryptBuffer, encryptBuffer, parseEncryptionKey } from './aes';

describe('AES-256-GCM KYC crypto', () => {
  const key = randomBytes(32);

  it('round-trips plaintext through encrypt/decrypt', () => {
    const plaintext = Buffer.from('national-id-document-bytes', 'utf8');
    const blob = encryptBuffer(plaintext, key);
    expect(blob.equals(plaintext)).toBe(false); // actually encrypted
    const restored = decryptBuffer(blob, key);
    expect(restored.equals(plaintext)).toBe(true);
  });

  it('fails to decrypt with the wrong key (auth tag mismatch)', () => {
    const blob = encryptBuffer(Buffer.from('secret'), key);
    const wrongKey = randomBytes(32);
    expect(() => decryptBuffer(blob, wrongKey)).toThrow();
  });

  it('validates the hex key length', () => {
    expect(() => parseEncryptionKey('tooshort')).toThrow();
    expect(parseEncryptionKey('a'.repeat(64))).toHaveLength(32);
  });
});
