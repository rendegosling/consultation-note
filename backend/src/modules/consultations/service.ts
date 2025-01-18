import { PGConsultationSessionRepository } from './postgresql-repository';
import { ConsultationSession, CreateConsultationRequest, IConsultationSessionRepository } from './types';
import { logger } from '../../infrastructure/logging/logger';

const COMPONENT_NAME = 'ConsultationService';

const repository = new PGConsultationSessionRepository();

export class ConsultationService {
  constructor(private repository: IConsultationSessionRepository) {}

  async createConsultation(
    request: CreateConsultationRequest,
  ): Promise<ConsultationSession> {
    try {
      const consultation = await this.repository.createConsultation(
        request.metadata,
      );

      logger.info(COMPONENT_NAME, 'Successfully created new consultation', {
        consultationId: consultation.id,
      });

      return consultation;
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to create consultation', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async updateStatus(
    id: string,
    status: ConsultationSession['status'],
  ): Promise<void> {
    try {
      await this.repository.updateConsultationStatus(id, status);

      logger.info(COMPONENT_NAME, 'Successfully updated consultation status', {
        consultationId: id,
        status,
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to update consultation status', {
        consultationId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async createSession(): Promise<ConsultationSession> {
    try {
      const session = await this.repository.createConsultation({});

      logger.info(COMPONENT_NAME, 'Successfully created new session', {
        sessionId: session.id,
      });

      return session;
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to create session', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async getConsultation(id: string): Promise<ConsultationSession | null> {
    try {
      const consultation = await this.repository.getConsultation(id);

      logger.info(COMPONENT_NAME, 'Consultation retrieved', {
        consultationId: id,
      });

      return consultation;
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to get consultation', {
        consultationId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
