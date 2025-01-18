export interface CreateConsultationRequest {
  metadata?: {
    deviceInfo?: string;
    userAgent?: string;
  };
}

export interface CreateConsultationResponse {
  session: {
    id: string;
    startedAt: Date;
    endedAt: Date | null;
    status: 'active' | 'completed' | 'error';
    metadata: {
      totalChunks?: number;
      [key: string]: unknown;
    };
  };
}

export interface UploadChunkRequest {
  chunkNumber: number;
  isLastChunk: boolean;
  metadata: {
    size: number;
    type: string;
    timestamp: string;
  };
} 