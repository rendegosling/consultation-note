export interface StorageOptions {
  bucket: string;
  region?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

export interface StorageMetadata {
  contentType?: string;
  [key: string]: string | undefined;
}

export interface StorageProvider {
  uploadFile(key: string, data: Buffer, metadata?: StorageMetadata): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  deleteFile(key: string): Promise<void>;
}

export interface StorageService {
  uploadFile(key: string, data: Buffer, metadata?: StorageMetadata): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  deleteFile(key: string): Promise<void>;
} 