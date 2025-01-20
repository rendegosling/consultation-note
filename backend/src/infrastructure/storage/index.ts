import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '@/config/app.config';
import { logger } from '@/infrastructure/logging';

const COMPONENT_NAME = 'StorageService';

export interface StorageMetadata {
  contentType?: string;
  [key: string]: string | undefined;
}

export class StorageService {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: config.aws.region,
      endpoint: config.aws.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
      }
    });
  }

  async uploadFile(key: string, data: Buffer, options: {
    bucket: string,
    metadata?: StorageMetadata
  }): Promise<void> {
    try {
      logger.debug(COMPONENT_NAME, 'Uploading file', { key, bucket: options.bucket });
      
      const cleanMetadata = options.metadata ? Object.fromEntries(
        Object.entries(options.metadata)
          .filter(([__, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ) : undefined;

      await this.client.send(new PutObjectCommand({
        Bucket: options.bucket,
        Key: key,
        Body: data,
        ContentType: options.metadata?.contentType,
        Metadata: cleanMetadata
      }));

      logger.debug(COMPONENT_NAME, 'File uploaded successfully', { key, bucket: options.bucket });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'File upload failed', {
        key,
        bucket: options.bucket,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getSignedUrl(key: string, options: {
    bucket: string,
    expiresIn?: number
  }): Promise<string> {
    try {
      logger.debug(COMPONENT_NAME, 'Generating signed URL', { key, bucket: options.bucket });
      
      const command = new GetObjectCommand({
        Bucket: options.bucket,
        Key: key
      });

      let url = await getSignedUrl(this.client, command, { 
        expiresIn: options.expiresIn || 3600 
      });
      
      if (process.env.NODE_ENV === 'development') {
        url = url.replace('http://localstack:4566', 'http://localhost:4566');
      }
      
      logger.debug(COMPONENT_NAME, 'Signed URL generated', { key, bucket: options.bucket });
      return url;
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to generate signed URL', {
        key,
        bucket: options.bucket,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async deleteFile(key: string, bucket: string): Promise<void> {
    try {
      logger.debug(COMPONENT_NAME, 'Deleting file', { key, bucket });
      
      await this.client.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: key
      }));

      logger.debug(COMPONENT_NAME, 'File deleted successfully', { key, bucket });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'File deletion failed', {
        key,
        bucket,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

export const storageService = new StorageService();