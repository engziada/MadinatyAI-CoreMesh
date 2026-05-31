import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KycService } from './kyc.service';
import { LocalStorageProvider } from './storage/local-storage.provider';
import { STORAGE_PROVIDER, StorageProvider } from './storage/storage.provider';

/**
 * KYC module. Binds the storage driver based on `KYC_STORAGE_DRIVER`
 * (MVP: local). An S3 driver can be added to this factory later.
 */
@Module({
  providers: [
    KycService,
    LocalStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (config: ConfigService, local: LocalStorageProvider): StorageProvider => {
        const driver = config.get<string>('kyc.storageDriver') ?? 'local';
        // Only 'local' is implemented in the MVP; extend here for 's3'.
        if (driver !== 'local') {
          throw new Error(`Unsupported KYC storage driver '${driver}'`);
        }
        return local;
      },
      inject: [ConfigService, LocalStorageProvider],
    },
  ],
  exports: [KycService],
})
export class KycModule {}
