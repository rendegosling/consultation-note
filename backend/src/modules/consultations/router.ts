import express from 'express';
import { ConsultationController } from './controller';
import { ConsultationService } from './service';
import { PGConsultationSessionRepository } from './pg-repository';
import { validateCreateConsultation, validateChunkUpload } from './validation';
import { S3StorageService } from '../../infrastructure/storage/s3-storage';

export const router = express.Router();

const repository = new PGConsultationSessionRepository();
const storageService = new S3StorageService({
  bucket: 'dev-consultations-audio',
  region: 'ap-southeast-2',
  endpoint: process.env.NODE_ENV === 'production' ? undefined : 'http://localstack:4566'
});
const service = new ConsultationService(repository);
const controller = new ConsultationController(service, storageService);

router.post('/sessions', controller.createSession.bind(controller));
router.post('/', validateCreateConsultation, controller.createConsultation.bind(controller));
router.get('/:id', controller.getConsultation.bind(controller));
router.patch('/:id/status', controller.updateStatus.bind(controller));