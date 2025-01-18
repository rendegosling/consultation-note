import { S3StorageProvider } from './providers/s3.provider';
import { StorageServiceImpl } from './storage.service';
import { config } from '@/config';

const provider = new S3StorageProvider({
  bucket: config.aws.s3.bucket,
  region: config.aws.region,
  endpoint: config.aws.endpoint,
  forcePathStyle: true
});

export const storageService = new StorageServiceImpl(provider);
export * from './types/storage.types';