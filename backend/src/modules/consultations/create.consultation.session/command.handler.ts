import { ConsultationSessionRepository } from '@/modules/consultations/repository';
import { ConsultationSession } from '@/modules/consultations/models';
import { logger } from '@/infrastructure/logging';

const COMPONENT_NAME = 'CreateConsultationSessionCommandHandler';

export interface CreateConsultationSessionCommand {
  metadata?: Record<string, unknown>;
}

export interface CreateConsultationSessionResult {
  session: ConsultationSession;
}

export class CreateConsultationSessionCommandHandler {
  constructor(private readonly repository: ConsultationSessionRepository) {}

  async execute(command: CreateConsultationSessionCommand): Promise<CreateConsultationSessionResult> {
    try {
      const session = await this.repository.createConsultation(command.metadata);
      
      logger.info(COMPONENT_NAME, 'Consultation session created', {
        id: session.id
      });

      return { session };
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to create consultation session', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}