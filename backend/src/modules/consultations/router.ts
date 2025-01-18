import express from 'express';
import multer from 'multer';
import { DynamoDB } from 'aws-sdk';
import { ConsultationController } from './controller';
import { ConsultationService } from './service';
import { DynamoDBConsultationSessionRepository } from './dynamodb-repository';
import { validateCreateConsultation, validateChunkUpload } from './validation';
import { S3StorageService } from '../../infrastructure/storage/s3-storage';
import { env } from '../../config/env';

const upload = multer({ storage: multer.memoryStorage() });
export const router = express.Router();

// Initialize DynamoDB client
const dynamoDB = new DynamoDB.DocumentClient({
  region: env.aws.region,
  endpoint: env.aws.endpoint,
  credentials: env.aws.credentials
});

// Initialize services
const repository = new DynamoDBConsultationSessionRepository(
  env.aws.dynamodb.tableName,
  dynamoDB
);

const storageService = new S3StorageService({
  bucket: 'dev-consultations-audio',
  region: env.aws.region,
  endpoint: env.aws.endpoint
});

const service = new ConsultationService(repository);
const controller = new ConsultationController(service, storageService);

// Routes
router.post('/sessions', controller.createSession.bind(controller));
router.post(
  '/',
  validateCreateConsultation,
  controller.createConsultation.bind(controller),
);
router.get('/:id', controller.getConsultation.bind(controller));
router.patch('/:id/status', controller.updateStatus.bind(controller));
router.post(
  '/sessions/:sessionId/chunks',
  upload.single('chunk'),
  validateChunkUpload,
  controller.uploadChunk.bind(controller),
);
