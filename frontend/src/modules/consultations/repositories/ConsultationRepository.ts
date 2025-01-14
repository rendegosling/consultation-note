import { db } from '@/infrastructure/database/client';
import { ConsultationSession, NewConsultationSession } from '@/infrastructure/database/schema';
import { logger } from '@/infrastructure/logging/logger';

const COMPONENT_NAME = 'ConsultationRepository';

export class ConsultationRepository {
  async createSession(): Promise<ConsultationSession> {
    try {
      const session = await db
        .insertInto('consultation_sessions')
        .values({
          id: crypto.randomUUID(),
          started_at: new Date(),
          status: 'active',
          metadata: {}
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      logger.info(COMPONENT_NAME, 'Session created in database', {
        sessionId: session.id
      });

      return session;
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to create session', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async updateSessionStatus(id: string, status: ConsultationSession['status']): Promise<void> {
    try {
      await db
        .updateTable('consultation_sessions')
        .set({
          status,
          updated_at: new Date()
        })
        .where('id', '=', id)
        .execute();

      logger.info(COMPONENT_NAME, 'Session status updated', {
        sessionId: id,
        status
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to update session status', {
        sessionId: id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

export const consultationRepository = new ConsultationRepository(); 