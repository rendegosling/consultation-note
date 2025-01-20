import { Router } from 'express';
import multer from 'multer';
import { UploadAudioChunkController } from './controller';
import { UploadAudioChunkCommandHandler } from './command.handler';
import { DynamoDBConsultationSessionRepository } from '@/infrastructure/database/repositories/dynamodb.consultation.session.repository';
import { DynamoDBClient } from '@/infrastructure/database/dynamodb.client';
import { config } from '@/config/app.config';
import { storageService } from '@/infrastructure/storage';
import { validateChunkUpload } from '../validation';

const upload = multer({ storage: multer.memoryStorage() });

export function uploadAudioChunkRouter(): Router {
  const router = Router();
  
  const repository = new DynamoDBConsultationSessionRepository(
    DynamoDBClient.getInstance(),
    config.aws.dynamodb.tableName
  );
  const commandHandler = new UploadAudioChunkCommandHandler(repository, storageService);
  const controller = new UploadAudioChunkController(commandHandler);

  router.post(
    '/consultations/sessions/:id/chunks',
    upload.single('chunk'),
    validateChunkUpload,
    controller.handle.bind(controller)
  );

  return router;
}