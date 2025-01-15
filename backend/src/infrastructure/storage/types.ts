export interface StorageConfig {
  bucket: string;
  endpoint?: string;
  region: string;
}

export interface StorageMetadata {
  contentType?: string;
  timestamp?: string;
  chunkNumber?: number;
  [key: string]: unknown;
}

export interface StorageService {
  uploadFile(key: string, data: Buffer, metadata?: StorageMetadata): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  deleteFile(key: string): Promise<void>;
} 