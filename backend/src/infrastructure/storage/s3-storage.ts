import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageService, StorageConfig, StorageMetadata } from './types';
import { logger } from '../logging/logger';

const COMPONENT_NAME = 'S3StorageService';

export class S3StorageService implements StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: StorageConfig) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: true,
    });
    this.bucket = config.bucket;

    logger.info(COMPONENT_NAME, 'Initialized S3 storage service', {
      type: 'INIT',
      bucket: this.bucket,
      endpoint: config.endpoint
    });
  }

  async uploadFile(key: string, data: Buffer, metadata?: StorageMetadata): Promise<void> {
    try {
      logger.info(COMPONENT_NAME, 'Starting file upload', {
        type: 'UPLOAD_START',
        key,
        size: data.length,
        contentType: metadata?.contentType
      });

      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: metadata?.contentType || 'audio/wav',
        Metadata: metadata ? this.sanitizeMetadata(metadata) : undefined,
      }));

      logger.info(COMPONENT_NAME, 'File uploaded successfully', {
        type: 'UPLOAD_SUCCESS',
        key
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to upload file', {
        type: 'UPLOAD_ERROR',
        key,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      logger.debug(COMPONENT_NAME, 'Generating signed URL', {
        type: 'SIGNED_URL_START',
        key,
        expiresIn
      });

      const url = await getSignedUrl(this.client, new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }), { expiresIn });

      logger.debug(COMPONENT_NAME, 'Generated signed URL', {
        type: 'SIGNED_URL_SUCCESS',
        key
      });

      return url;
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to generate signed URL', {
        type: 'SIGNED_URL_ERROR',
        key,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      logger.info(COMPONENT_NAME, 'Starting file deletion', {
        type: 'DELETE_START',
        key
      });

      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));

      logger.info(COMPONENT_NAME, 'File deleted successfully', {
        type: 'DELETE_SUCCESS',
        key
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to delete file', {
        type: 'DELETE_ERROR',
        key,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private sanitizeMetadata(metadata: StorageMetadata): Record<string, string> {
    logger.debug(COMPONENT_NAME, 'Sanitizing metadata', {
      type: 'SANITIZE_METADATA',
      originalKeys: JSON.stringify(Object.keys(metadata))
    });
    
    return Object.entries(metadata).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: String(value),
    }), {});
  }
} 