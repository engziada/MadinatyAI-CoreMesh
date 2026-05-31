/** Injection token for the active {@link StorageProvider} implementation. */
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

/**
 * Storage abstraction for encrypted KYC blobs. The MVP ships a local-disk
 * driver; an S3/MinIO driver can be added later without touching KycService.
 */
export interface StorageProvider {
  /** Persist a blob under `key`, returning the canonical stored path/key. */
  save(key: string, data: Buffer): Promise<string>;
  /** Read a previously stored blob. */
  read(key: string): Promise<Buffer>;
  /** Remove a stored blob (best-effort). */
  delete(key: string): Promise<void>;
}
