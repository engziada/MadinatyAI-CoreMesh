import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { KycStatus } from '@prisma/client';
import { PrismaService } from '@madinatyai/prisma';
import { decryptBuffer, encryptBuffer, parseEncryptionKey } from './crypto/aes';
import { STORAGE_PROVIDER, StorageProvider } from './storage/storage.provider';

/**
 * KYC ingestion + review engine.
 *
 * Documents are AES-256-GCM encrypted in-memory BEFORE being handed to the
 * storage layer, so plaintext IDs never touch disk/bucket. Only the encrypted
 * blob path is persisted (`KycRegistry.encryptedIdPath`). The hub acts as a
 * transparent broker: it validates authenticity, it is not a financial party.
 */
@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);
  private readonly key: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {
    this.key = parseEncryptionKey(config.get<string>('kyc.encryptionKey') ?? '');
  }

  /** Encrypt + store a submitted document and register it as PENDING. */
  async submit(userId: string, idNumber: string, document: Buffer) {
    const user = await this.prisma.globalUser.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`GlobalUser ${userId} not found`);
    }

    const encrypted = encryptBuffer(document, this.key);
    const key = `${userId}/${randomUUID()}.enc`;
    const storedPath = await this.storage.save(key, encrypted);

    const record = await this.prisma.kycRegistry.upsert({
      where: { userId },
      create: {
        userId,
        idNumber,
        encryptedIdPath: storedPath,
        status: KycStatus.PENDING,
      },
      update: {
        idNumber,
        encryptedIdPath: storedPath,
        status: KycStatus.PENDING,
        reviewedAt: null,
      },
    });

    this.logger.log(`KYC submitted for user ${userId} (status=PENDING)`);
    return { id: record.id, status: record.status };
  }

  /** Approve/reject a KYC record; approval flips GlobalUser.isVerified. */
  async review(kycId: string, decision: 'APPROVE' | 'REJECT') {
    const record = await this.prisma.kycRegistry.findUnique({ where: { id: kycId } });
    if (!record) {
      throw new NotFoundException(`KYC record ${kycId} not found`);
    }

    const status = decision === 'APPROVE' ? KycStatus.APPROVED : KycStatus.REJECTED;

    const [updated] = await this.prisma.$transaction([
      this.prisma.kycRegistry.update({
        where: { id: kycId },
        data: { status, reviewedAt: new Date() },
      }),
      this.prisma.globalUser.update({
        where: { id: record.userId },
        data: { isVerified: status === KycStatus.APPROVED },
      }),
    ]);

    return { id: updated.id, status: updated.status };
  }

  /** Decrypt a stored document for an authorised reviewer. */
  async getDecryptedDocument(kycId: string): Promise<Buffer> {
    const record = await this.prisma.kycRegistry.findUnique({ where: { id: kycId } });
    if (!record) {
      throw new NotFoundException(`KYC record ${kycId} not found`);
    }
    const blob = await this.storage.read(record.encryptedIdPath);
    return decryptBuffer(blob, this.key);
  }
}
