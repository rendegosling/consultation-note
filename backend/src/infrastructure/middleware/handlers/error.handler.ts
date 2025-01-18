import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app.error';
import { logger } from '@/infrastructure/logging';

const COMPONENT_NAME = 'ErrorHandler';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.id;
  
  logger.error(COMPONENT_NAME, 'Request error occurred', {
    requestId,
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack,
    statusCode: err instanceof AppError ? err.statusCode : 500
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      requestId
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    requestId
  });
};