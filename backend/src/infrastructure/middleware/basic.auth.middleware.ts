import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging';

const COMPONENT_NAME = 'BasicAuthMiddleware';

export const basicAuth = (req: Request, res: Response, next: NextFunction) => {
  // Skip auth for health check
  if (req.path === '/health') {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    logger.warn(COMPONENT_NAME, 'Missing or invalid auth header');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [username, password] = credentials.split(':');

  if (username === 'admin' && password === 'password') {
    next();
  } else {
    logger.warn(COMPONENT_NAME, 'Invalid credentials');
    res.status(401).json({ error: 'Invalid credentials' });
  }
}; 