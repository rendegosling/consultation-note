import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../infrastructure/middleware/error-handler';

const createConsultationSchema = z.object({
  metadata: z.object({
    deviceInfo: z.string().optional(),
    userAgent: z.string().optional(),
  }).optional(),
});

export const validateCreateConsultation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = createConsultationSchema.safeParse(req.body);
  
  if (!result.success) {
    throw new AppError(400, 'Invalid request body');
  }
  
  next();
}; 