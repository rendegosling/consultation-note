import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BaseStorageProvider } from './base.provider';
import { StorageOptions, StorageMetadata } from '../types/storage.types';
import { logger } from '@/infrastructure/logging';

const COMPONENT_NAME = 'S3StorageProvider';

export class S3StorageProvider extends BaseStorageProvider {
  private client: S3Client;

  constructor(options: StorageOptions) {
    super(options);
    this.client = new S3Client({
      region: options.region,
      endpoint: options.endpoint,
      forcePathStyle: options.forcePathStyle ?? true,
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
      }
    });
  }

  async uploadFile(key: string, data: Buffer, metadata?: StorageMetadata): Promise<void> {
    try {
      logger.info(COMPONENT_NAME, 'Uploading file to S3', { key });
      
      const cleanMetadata = metadata ? Object.fromEntries(
        Object.entries(metadata)
          .filter(([__, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ) as Record<string, string> : undefined;

      await this.client.send(new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
        Body: data,
        ContentType: metadata?.contentType,
        Metadata: cleanMetadata
      }));

      logger.info(COMPONENT_NAME, 'Successfully uploaded file to S3', { key });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to upload file to S3', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      logger.info(COMPONENT_NAME, 'Generating signed URL', { key });
      
      const command = new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: key
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      
      logger.info(COMPONENT_NAME, 'Successfully generated signed URL', { key });
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
      logger.info(COMPONENT_NAME, 'Deleting file from S3', { key });
      
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.options.bucket,
        Key: key
      }));

      logger.info(COMPONENT_NAME, 'Successfully deleted file from S3', { key });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to delete file from S3', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}