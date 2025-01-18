import { StorageOptions, StorageProvider, StorageMetadata } from '../types/storage.types';

export abstract class BaseStorageProvider implements StorageProvider {
  constructor(protected readonly options: StorageOptions) {}

  abstract uploadFile(key: string, data: Buffer, metadata?: StorageMetadata): Promise<void>;
  abstract getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  abstract deleteFile(key: string): Promise<void>;
} 