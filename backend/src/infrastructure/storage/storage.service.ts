import { StorageService, StorageProvider, StorageMetadata } from './types/storage.types';
import { logger } from '@/infrastructure/logging';

const COMPONENT_NAME = 'StorageService';

export class StorageServiceImpl implements StorageService {
  constructor(private provider: StorageProvider) {}

  async uploadFile(key: string, data: Buffer, metadata?: StorageMetadata): Promise<void> {
    try {
      logger.debug(COMPONENT_NAME, 'Starting file upload', { key });
      await this.provider.uploadFile(key, data, metadata);
      logger.debug(COMPONENT_NAME, 'File upload completed', { key });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'File upload failed', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    try {
      logger.debug(COMPONENT_NAME, 'Generating signed URL', { key });
      const url = await this.provider.getSignedUrl(key, expiresIn);
      logger.debug(COMPONENT_NAME, 'Signed URL generated', { key });
      return url;
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to generate signed URL', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      logger.debug(COMPONENT_NAME, 'Starting file deletion', { key });
      await this.provider.deleteFile(key);
      logger.debug(COMPONENT_NAME, 'File deletion completed', { key });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'File deletion failed', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
} 