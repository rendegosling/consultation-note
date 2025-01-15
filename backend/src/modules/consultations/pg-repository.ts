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
      const result = await db
        .insertInto('consultations.consultation_sessions')
        .values({
          id: randomUUID(),
          status: 'active' as const,
          metadata,
          started_at: sql`CURRENT_TIMESTAMP`,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return this.mapToConsultationSession(result);
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to create consultation', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async getConsultation(id: string): Promise<ConsultationSession | null> {
    try {
      const consultation = await db
        .selectFrom('consultations.consultation_sessions')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();

      if (!consultation) {
        logger.debug(COMPONENT_NAME, 'No consultation found with provided ID', {
          consultationId: id,
        });
        return null;
      }

      return this.mapToConsultationSession(consultation as DBConsultationRow);
    } catch (error) {
      logger.error(
        COMPONENT_NAME,
        'Database error while fetching consultation',
        {
          consultationId: id,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      throw error;
    }
  }

  async updateConsultationStatus(
    id: string,
    status: ConsultationSession['status'],
  ): Promise<void> {
    try {
      const result = await db
        .updateTable('consultations.consultation_sessions')
        .set({ status })
        .where('id', '=', id)
        .execute();

      logger.debug(COMPONENT_NAME, 'Successfully updated consultation status', {
        consultationId: id,
        status,
        rowsAffected: result.length,
      });
    } catch (error) {
      logger.error(
        COMPONENT_NAME,
        'Database error while updating consultation status',
        {
          consultationId: id,
          status,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      throw error;
    }
  }

  private mapToConsultationSession(row: DBConsultationRow): ConsultationSession {
    return {
      id: row.id,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      status: row.status,
      metadata: row.metadata,
    };
  }
}

export const consultationSessionRepository = new PGConsultationSessionRepository();
