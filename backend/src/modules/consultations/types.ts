import { JsonObject } from "@/infrastructure/database/schema";

export interface ConsultationSession {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  status: 'active' | 'completed' | 'error';
  metadata: JsonObject;
}

export interface AudioChunk {
  id: string;
  sessionId: string;
  chunkNumber: number;
  isLastChunk: boolean;
  status: 'pending' | 'processing' | 'completed' | 'error';
  metadata: {
    size: number;
    type: string;
    timestamp: string;
    duration?: number;
    processedAt?: string;
    error?: string;
  };
}

export interface CreateConsultationRequest {
  metadata?: {
    deviceInfo?: string;
    userAgent?: string;
  };
}

export interface UploadChunkRequest {
  sessionId: string;
  chunk: Buffer;
  chunkNumber: number;
  isLastChunk: boolean;
  metadata: {
    size: number;
    type: string;
    timestamp: string;
  };
}

export interface IConsultationSessionRepository {
  createConsultation(metadata?: JsonObject): Promise<ConsultationSession>;
  getConsultation(id: string): Promise<ConsultationSession | null>;
  updateConsultationStatus(id: string, status: ConsultationSession['status']): Promise<void>;
}
