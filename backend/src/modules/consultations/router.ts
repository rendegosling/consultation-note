import express from 'express';
import multer from 'multer';
import { DynamoDB } from 'aws-sdk';
import { ConsultationController } from './controller';
import { validateCreateConsultation, validateChunkUpload } from './validation';
import { config } from '@/config';
import { logger } from '@/infrastructure/logging';
import { storageService } from '@/infrastructure/storage';
import { DynamoDBConsultationSessionRepository } from '@/infrastructure/database/repositories/dynamodb.consultation-session.repository';

const COMPONENT_NAME = 'ConsultationRouter';
const upload = multer({ storage: multer.memoryStorage() });
export const router = express.Router();

// Initialize DynamoDB client
const dynamoDB = new DynamoDB.DocumentClient({
  region: config.aws.region,
  endpoint: config.aws.endpoint || 'http://localstack:4566', // LocalStack default
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
});

// Initialize repository and controller
const repository = new DynamoDBConsultationSessionRepository(
  dynamoDB,
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
