import express from 'express';
import cors from 'cors';
import { router as consultationRouter } from './modules/consultations/router';
import { addNoteRouter } from './modules/consultations/add.note/router';
import { errorHandler } from './infrastructure/middleware';
import { logger } from '@/infrastructure/logging';
import { config } from '@/config';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Module routes
app.use('/consultations', consultationRouter);
app.use(addNoteRouter);

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
