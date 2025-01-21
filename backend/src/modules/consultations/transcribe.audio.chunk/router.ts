import { Router } from 'express';
import { TranscribeAudioChunkController } from './controller';
import { TranscribeAudioChunkCommandHandler } from './command.handler';
import { DynamoDBConsultationSessionRepository } from '@/infrastructure/database/repositories/dynamodb.consultation.session.repository';
import { DynamoDBClient } from '@/infrastructure/database/dynamodb.client';
import { config } from '@/config/app.config';

export function createTranscribeAudioChunkRouter(): Router {
  const router = Router();
  
  const repository = new DynamoDBConsultationSessionRepository(
    DynamoDBClient.getInstance(),
    config.aws.dynamodb.tableName
  );
  const commandHandler = new TranscribeAudioChunkCommandHandler(repository);
  const controller = new TranscribeAudioChunkController(commandHandler);

  router.post(
    '/consultations/sessions/:sessionId/audio-chunks/:chunkNumber/transcribe',
    controller.handle.bind(controller)
  );

  return router;
}