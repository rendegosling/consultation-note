import { Router } from 'express';
import { AddNoteController } from './controller';
import { AddNoteCommandHandler } from './command.handler';
import { DynamoDBConsultationSessionRepository } from '@/infrastructure/database/repositories/dynamodb.consultation.session.repository';
import { DynamoDBClient } from '@/infrastructure/database/dynamodb.client';
import { config } from '@/config';

export function createAddNoteRouter() {
  const router = Router();
  
  // Initialize dependencies
  const repository = new DynamoDBConsultationSessionRepository(
    DynamoDBClient.getInstance(),
    config.aws.dynamodb.tableName
  );
  const commandHandler = new AddNoteCommandHandler(repository);
  const controller = new AddNoteController(commandHandler);

  router.post(
    '/consultations/sessions/:sessionId/notes',
    (req, res) => controller.handle(req, res)
  );

  return router;
}

// Export a singleton instance for use in the main app
export const addNoteRouter = createAddNoteRouter();