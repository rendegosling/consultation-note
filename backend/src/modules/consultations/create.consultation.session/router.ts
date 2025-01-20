import { Router } from 'express';
import { CreateConsultationSessionController } from './controller';
import { CreateConsultationSessionCommandHandler } from './command.handler';
import { DynamoDBConsultationSessionRepository } from '@/infrastructure/database/repositories/dynamodb.consultation.session.repository';
import { DynamoDBClient } from '@/infrastructure/database/dynamodb.client';
import { config } from '@/config/app.config';
import { validateCreateConsultation } from '../validation';

export function createConsultationSessionRouter(): Router {
  const router = Router();
  
  const repository = new DynamoDBConsultationSessionRepository(
    DynamoDBClient.getInstance(),
    config.aws.dynamodb.tableName
  );
  const commandHandler = new CreateConsultationSessionCommandHandler(repository);
  const controller = new CreateConsultationSessionController(commandHandler);

  router.post(
    '/consultations/sessions',
    validateCreateConsultation,
    controller.handle.bind(controller)
  );

  return router;
}