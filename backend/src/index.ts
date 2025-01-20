import express from 'express';
import cors from 'cors';
import { addNoteRouter } from './modules/consultations/add.note/router';
import { errorHandler } from './infrastructure/middleware';
import { logger } from '@/infrastructure/logging';
import { config } from '@/config/app.config';
import { createGenerateSummaryRouter } from './modules/consultations/generate.summary/router';
import { createConsultationSessionRouter } from './modules/consultations/create.consultation.session/router';
import { uploadAudioChunkRouter } from './modules/consultations/upload.audio.chunk/router';
import { basicAuth } from './infrastructure/middleware/basic.auth.middleware';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(basicAuth);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Module routes
app.use(createGenerateSummaryRouter());
app.use(addNoteRouter);
app.use(createConsultationSessionRouter());
app.use(uploadAudioChunkRouter());

// Error handling
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  logger.info('Server', `Running on port ${config.port}`);
});

// Handle uncaught errors
process.on('unhandledRejection', (error: Error) => {
  logger.error('UnhandledRejection', error.message, { stack: error.stack });
  process.exit(1);
});
