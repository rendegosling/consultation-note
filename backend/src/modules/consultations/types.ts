export interface ConsultationSession {
  id: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'completed' | 'error';
  metadata: Record<string, any>;
}

export interface CreateConsultationRequest {
  metadata?: {
    deviceInfo?: string;
    userAgent?: string;
  };
}

export interface CreateSessionRequest {
  metadata?: {
    deviceInfo?: string;
    userAgent?: string;
  };
}

export interface IConsultationSessionRepository {
  createConsultation(metadata?: JsonObject): Promise<ConsultationSession>;
  getConsultation(id: string): Promise<ConsultationSession | null>;
  updateConsultationStatus(id: string, status: ConsultationSession['status']): Promise<void>;
}
