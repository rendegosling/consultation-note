import express from 'express';
import cors from 'cors';
import { router as consultationRouter } from './modules/consultations/router';
import { errorHandler } from './infrastructure/middleware/error-handler';
import { logger } from './infrastructure/logging/logger';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Module routes
app.use('/consultations', consultationRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info('Server', `Running on port ${port}`);
});

// Handle uncaught errors
process.on('unhandledRejection', (error: Error) => {
  logger.error('UnhandledRejection', error.message, { stack: error.stack });
  process.exit(1);
}); 