import { db } from '../../infrastructure/database';
import { ConsultationSession } from './types';
import { logger } from '../../infrastructure/logging/logger';
import { sql, Selectable } from 'kysely';
import { Database, JsonObject } from '../../infrastructure/database/schema';
import { randomUUID } from 'crypto';
import { IConsultationSessionRepository } from './types';

const COMPONENT_NAME = 'ConsultationRepository';

type DBConsultationRow = Selectable<Database['consultations.consultation_sessions']>;

export class PGConsultationSessionRepository implements IConsultationSessionRepository {
  async createConsultation(metadata: JsonObject = {}): Promise<ConsultationSession> {
    try {
      const consultation = await db
        .insertInto('consultation_sessions')
        .values({
          id: crypto.randomUUID(),
          started_at: sql`CURRENT_TIMESTAMP`,
          status: 'active',
          metadata
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      logger.info(COMPONENT_NAME, 'Consultation created in database', {
        consultationId: consultation.id
      });

      return this.mapToConsultationSession(consultation);
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to create consultation', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getConsultation(id: string): Promise<ConsultationSession | null> {
    try {
      const consultation = await db
        .selectFrom('consultation_sessions')
        .where('id', '=', id)
        .executeTakeFirst();

      if (!consultation) return null;

      return this.mapToConsultationSession(consultation);
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to get consultation', {
        consultationId: id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async updateConsultationStatus(
    id: string, 
    status: ConsultationSession['status']
  ): Promise<void> {
    try {
      await db
        .updateTable('consultation_sessions')
        .set({
          status,
        })
        .where('id', '=', id)
        .execute();

      logger.info(COMPONENT_NAME, 'Consultation status updated', {
        consultationId: id,
        status
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to update consultation status', {
        consultationId: id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private mapToConsultationSession(data: any): ConsultationSession {
    return {
      id: data.id,
      startedAt: new Date(data.started_at),
      endedAt: data.ended_at ? new Date(data.ended_at) : undefined,
      status: data.status,
      metadata: data.metadata || {}
    };
  }
}

export const consultationSessionRepository = new PGConsultationSessionRepository();
