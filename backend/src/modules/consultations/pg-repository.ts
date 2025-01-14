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

      logger.debug(COMPONENT_NAME, 'Successfully inserted consultation record', {
        consultationId: consultation.id,
        status: consultation.status
      });

      return this.mapToConsultationSession(consultation);
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Database error while creating consultation', {
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

      if (!consultation) {
        logger.debug(COMPONENT_NAME, 'No consultation found with provided ID', { consultationId: id });
        return null;
      }

      return this.mapToConsultationSession(consultation);
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Database error while fetching consultation', {
        consultationId: id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async updateConsultationStatus(id: string, status: ConsultationSession['status']): Promise<void> {
    try {
      const result = await db
        .updateTable('consultation_sessions')
        .set({ status })
        .where('id', '=', id)
        .execute();

      logger.debug(COMPONENT_NAME, 'Successfully updated consultation status', {
        consultationId: id,
        status,
        rowsAffected: result.length
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Database error while updating consultation status', {
        consultationId: id,
        status,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private mapToConsultationSession(row: any): ConsultationSession {
    return {
      id: row.id,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      status: row.status,
      metadata: row.metadata
    };
  }
}

export const consultationSessionRepository = new PGConsultationSessionRepository();
