import { ConsultationSession } from '@/modules/consultations/models';

export interface ConsultationSessionRepository {
  findById(id: string): Promise<ConsultationSession | null>;
  save(consultation: ConsultationSession): Promise<void>;
  createConsultation(metadata?: Record<string, unknown>): Promise<ConsultationSession>;
  updateConsultationStatus(id: string, status: string): Promise<void>;
}
