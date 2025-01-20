import { Router } from 'express';
import { GenerateSummaryController } from './controller';
import { GenerateSummaryCommandHandler } from './command.handler';
import { DynamoDBConsultationSessionRepository } from '@/infrastructure/database/repositories/dynamodb.consultation.session.repository';
import { DynamoDBClient } from '@/infrastructure/database/dynamodb.client';
import { config } from '@/config/app.config';

export function createGenerateSummaryRouter(): Router {
  const router = Router();
  
  const sessionRepository = new DynamoDBConsultationSessionRepository(DynamoDBClient.getInstance(), config.aws.dynamodb.tableName);
  const commandHandler = new GenerateSummaryCommandHandler(sessionRepository);
  const controller = new GenerateSummaryController(commandHandler);

  router.post(
    '/consultations/sessions/:sessionId/summary',
    controller.generateSummary.bind(controller)
  );

  return router;
}