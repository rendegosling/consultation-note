import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '@/infrastructure/logging';

const COMPONENT_NAME = 'RequestIdHandler';

export const requestIdHandler = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || randomUUID();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  
  logger.debug(COMPONENT_NAME, 'Request ID assigned', {
    requestId,
    method: req.method,
    path: req.path
  });
  
  next();
};