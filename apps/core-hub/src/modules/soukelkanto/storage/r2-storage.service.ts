import { randomBytes } from 'node:crypto';
import { extname } from 'node:path';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
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

interface PresignResult {
  uploadUrl: string;
  r2Key: string;
  publicUrl: string;
  expiresInSeconds: number;
}

/**
 * Cloudflare R2 storage adapter for listing photos.
 *
 * Wraps the AWS S3 SDK v3 against an R2-compatible endpoint. When the R2
 * credentials are not provided (typical local-dev), every call throws
 * `ServiceUnavailableException` with a clear message — the FE handles this
 * by hiding the upload flow rather than crashing.
 *
 * Key shape: `uploads/<userId>/<YYYY-MM-DD>/<random>.<ext>`. Random component
 * prevents enumeration. Date prefix helps with lifecycle rules + retention.
 */
@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicBase: string;
  private readonly ttl: number;

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

    if (!endpoint || !accessKeyId || !secret || !bucket || !publicBase) {
      this.client = null;
      this.logger.warn(
        'R2 not configured — photo-upload-url will return 503. Set KANTO_R2_* envs to enable.',
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
   * Generate a presigned PUT URL the FE uses to upload a single photo
   * directly to R2 (bypasses the BE for the bytes themselves).
   */
  async presignUpload(params: PresignParams): Promise<PresignResult> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Photo storage not configured. Set KANTO_R2_* in .env to enable uploads.',
      );
    }

    const r2Key = this.buildKey(params.userId, params.filename);
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: r2Key,
      ContentType: params.contentType,
      ContentLength: params.bytes,
    });
    const uploadUrl = await getSignedUrl(this.client, cmd, { expiresIn: this.ttl });
    return {
      uploadUrl,
      r2Key,
      publicUrl: `${this.publicBase.replace(/\/$/, '')}/${r2Key}`,
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
