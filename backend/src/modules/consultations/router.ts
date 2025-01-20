import express from 'express';
import multer from 'multer';
import { ConsultationController } from './controller';
import { validateCreateConsultation, validateChunkUpload } from './validation';
import { config } from '@/config/app.config';
import { storageService } from '@/infrastructure/storage';
import { DynamoDBConsultationSessionRepository } from '@/infrastructure/database/repositories/dynamodb.consultation.session.repository';
import { DynamoDBClient } from '@/infrastructure/database/dynamodb.client';

const upload = multer({ storage: multer.memoryStorage() });
export const router = express.Router();

// Initialize repository and controller
const repository = new DynamoDBConsultationSessionRepository(
  DynamoDBClient.getInstance(),
  config.aws.dynamodb.tableName
);
const controller = new ConsultationController(repository, storageService);

// Routes
router.post('/sessions', 
  validateCreateConsultation, 
  controller.createConsultation.bind(controller)
);

router.get('/sessions/:id', 
  controller.getConsultation.bind(controller)
);

router.post('/sessions/:id/chunks',
  upload.single('chunk'),
  validateChunkUpload,
  controller.uploadChunk.bind(controller)
);

router.patch('/sessions/:id/status',
  controller.updateStatus.bind(controller)
);
