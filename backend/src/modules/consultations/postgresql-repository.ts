import { db } from '../../infrastructure/database';
import { ConsultationSession } from './types';
import { logger } from '../../infrastructure/logging/logger';
import { sql, Selectable } from 'kysely';
import { Database, JsonObject } from '../../infrastructure/database/schema';
import { randomUUID } from 'crypto';
import { IConsultationSessionRepository } from './types';

const COMPONENT_NAME = 'PostgreSQLConsultationRepository';

type DBConsultationRow = Selectable<Database['consultations.consultation_sessions']>;

export class PGConsultationSessionRepository implements IConsultationSessionRepository {
  constructor() {
    logger.info(COMPONENT_NAME, 'Initialized PostgreSQL repository', {
      type: 'INIT'
    });
  }

  async createConsultation(metadata: JsonObject = {}): Promise<ConsultationSession> {
    try {
      logger.info(COMPONENT_NAME, 'Creating consultation session', {
        type: 'CREATE_START',
        metadata: JSON.stringify(metadata)
      });

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

      const session = this.mapToConsultationSession(result);
      
      logger.info(COMPONENT_NAME, 'Successfully created consultation session', {
        type: 'CREATE_SUCCESS',
        sessionId: session.id
      });

      return session;
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to create consultation', {
        type: 'CREATE_ERROR',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getConsultation(id: string): Promise<ConsultationSession | null> {
    try {
      logger.info(COMPONENT_NAME, 'Fetching consultation session', {
        type: 'GET_START',
        sessionId: id
      });

      const consultation = await db
        .selectFrom('consultations.consultation_sessions')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();

      if (!consultation) {
        logger.info(COMPONENT_NAME, 'Consultation session not found', {
          type: 'GET_NOT_FOUND',
          sessionId: id
        });
        return null;
      }

      logger.info(COMPONENT_NAME, 'Successfully fetched consultation session', {
        type: 'GET_SUCCESS',
        sessionId: id
      });

      return this.mapToConsultationSession(consultation as DBConsultationRow);
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to get consultation', {
        type: 'GET_ERROR',
        sessionId: id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async updateConsultationStatus(id: string, status: ConsultationSession['status']): Promise<void> {
    try {
      logger.info(COMPONENT_NAME, 'Updating consultation status', {
        type: 'UPDATE_START',
        sessionId: id,
        status
      });

      const result = await db
        .updateTable('consultations.consultation_sessions')
        .set({ status })
        .where('id', '=', id)
        .execute();

      logger.info(COMPONENT_NAME, 'Successfully updated consultation status', {
        type: 'UPDATE_SUCCESS',
        sessionId: id,
        status,
        rowsAffected: result.length
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to update consultation status', {
        type: 'UPDATE_ERROR',
        sessionId: id,
        status,
        error: error instanceof Error ? error.message : String(error)
      });
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
