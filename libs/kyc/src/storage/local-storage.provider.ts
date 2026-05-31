import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { StorageProvider } from './storage.provider';

/**
 * Local filesystem storage driver (MVP). Writes encrypted blobs under the
 * configured `KYC_STORAGE_LOCAL_PATH`. Paths are constrained to that root to
 * prevent traversal.
 */
@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = resolve(config.get<string>('kyc.storageLocalPath') ?? './storage/kyc');
  }

  private resolveSafe(key: string): string {
    const target = resolve(join(this.root, key));
    if (!target.startsWith(this.root)) {
      throw new Error('Invalid storage key (path traversal blocked)');
    }
    return target;
  }

  async save(key: string, data: Buffer): Promise<string> {
    const target = this.resolveSafe(key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, data);
    return key;
  }

  async read(key: string): Promise<Buffer> {
    return readFile(this.resolveSafe(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolveSafe(key), { force: true });
  }
}
