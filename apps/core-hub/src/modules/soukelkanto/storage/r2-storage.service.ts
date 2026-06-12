import { randomBytes } from 'node:crypto';
import { extname } from 'node:path';
import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface PresignParams {
  userId: string;
  filename: string;
  contentType: string;
  bytes: number;
}

export interface PresignResult {
  uploadUrl: string;
  r2Key: string;
  publicUrl: string;
  expiresInSeconds: number;
}

/**
 * Cloudflare R2 storage adapter for listing photos.
 *
 * Wraps the AWS S3 SDK v3 against an R2-compatible endpoint. When R2 is not
 * configured (typical local-dev), falls back to local disk storage:
 *   - `presignUpload` returns a local PUT URL (`/api/v1/uploads/<key>`)
 *   - The raw-upload middleware in main.ts streams bytes to `./storage/uploads/`
 *   - Files are served statically via `GET /api/v1/uploads/<key>`
 *
 * This keeps the FE upload flow identical in dev and production.
 *
 * Key shape: `uploads/<userId>/<YYYY-MM-DD>/<random>.<ext>`
 */
@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicBase: string;
  private readonly ttl: number;
  private readonly localBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = config.get<string>('r2.endpoint');
    const accessKeyId = config.get<string>('r2.accessKeyId');
    const secret = config.get<string>('r2.secret');
    const bucket = config.get<string>('r2.bucket');
    const publicBase = config.get<string>('r2.publicBase');
    const region = config.get<string>('r2.region') ?? 'auto';
    this.ttl = config.get<number>('r2.presignTtlSeconds') ?? 300;
    this.bucket = bucket ?? '';
    this.publicBase = publicBase ?? '';
    this.localBaseUrl = config.get<string>('corsOrigins')?.[0]?.replace(/\/$/, '') ?? '';

    // Dev override: forcibly skip R2 even when credentials are present. Useful
    // when R2 CORS isn't configured for localhost. Forbidden in production —
    // F-02 hardening already refuses local uploads when NODE_ENV=production.
    const forceLocal = config.get<boolean>('r2.forceLocal') === true;
    if (forceLocal) {
      this.client = null;
      this.logger.warn(
        'R2_FORCE_LOCAL=true — bypassing R2 client, using local disk fallback.',
      );
      return;
    }

    if (!endpoint || !accessKeyId || !secret || !bucket || !publicBase) {
      this.client = null;
      this.logger.warn(
        'R2 not configured — using local disk fallback for photo uploads.',
      );
      return;
    }

    this.client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey: secret },
      // R2 requires path-style addressing.
      forcePathStyle: true,
    });
  }

  /** True when R2 credentials are present and the SDK client is ready. */
  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * R-11 F-12 — derive the canonical public URL for a given r2Key without
   * trusting any client-supplied value. Returns null if the bucket has no
   * configured `publicBase` (the FE then falls back to the local-upload URL
   * pattern in dev).
   */
  publicUrlForKey(key: string): string | null {
    // When the R2 client is disabled (force-local or unconfigured), files live
    // on local disk — return null so the caller falls back to the
    // `/api/v1/uploads/<key>` path served by the upload middleware. Returning
    // the R2 publicBase here would 404 because the file was never uploaded
    // to R2 in the first place.
    if (!this.client) return null;
    if (!this.publicBase) return null;
    return `${this.publicBase.replace(/\/$/, '')}/${key}`;
  }

  /**
   * Generate a presigned PUT URL the FE uses to upload a single photo.
   *
   * When R2 is configured → returns a real R2 presigned URL.
   * When R2 is NOT configured → returns a local disk URL handled by the
   * raw-upload middleware in main.ts (zero FE changes required).
   */
  async presignUpload(params: PresignParams): Promise<PresignResult> {
    const key = this.buildKey(params.userId, params.filename);

    if (!this.client) {
      // Local disk fallback — the FE PUTs to this URL and the raw-upload
      // middleware streams the bytes straight to disk.
      const uploadUrl = this.localBaseUrl
        ? `${this.localBaseUrl}/api/v1/uploads/${key}`
        : `/api/v1/uploads/${key}`;
      return {
        uploadUrl,
        r2Key: key,
        publicUrl: uploadUrl,
        expiresInSeconds: 300,
      };
    }

    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: params.contentType,
      ContentLength: params.bytes,
    });
    const uploadUrl = await getSignedUrl(this.client, cmd, { expiresIn: this.ttl });
    return {
      uploadUrl,
      r2Key: key,
      publicUrl: `${this.publicBase.replace(/\/$/, '')}/${key}`,
      expiresInSeconds: this.ttl,
    };
  }

  private buildKey(userId: string, filename: string): string {
    const day = new Date().toISOString().slice(0, 10);
    const ext = (extname(filename) || '.jpg').toLowerCase();
    const random = randomBytes(8).toString('hex');
    return `uploads/${userId}/${day}/${random}${ext}`;
  }
}
