export interface ConsultationSession {
  id: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'completed' | 'error';
  metadata: {
    totalChunks?: number;
    duration?: number;
  };
}

export interface CreateSessionRequest {
  metadata?: {
    deviceInfo?: string;
    userAgent?: string;
  };
}

export interface CreateSessionResponse {
  session: ConsultationSession;
} 