import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/infrastructure/middleware';
import { config } from '@/config/app.config';

export const createConsultationSchema = z.object({
  metadata: z
    .object({
      deviceInfo: z.string().optional(),
      userAgent: z.string().optional(),
    })
    .optional(),
});

export const audioChunkSchema = z.object({
  chunkNumber: z.number().positive('Chunk number must be positive'),
  isLastChunk: z.boolean(),
  metadata: z.object({
    size: z.number().max(
      config.validation.audio.maxChunkSize, 
      'File too large'
    ),
    type: z
      .string()
      .refine(
        (type) => config.validation.audio.allowedMimeTypes.includes(type),
        'Invalid audio format',
      ),
    timestamp: z.string().datetime(),
  }),
});

export const validateCreateConsultation = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = createConsultationSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError(400, 'Invalid request body');
  }

  next();
};

export const validateChunkUpload = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No audio chunk provided');
    }

    if (req.file.size > config.validation.audio.maxChunkSize) {
      throw new AppError(400, 'Chunk size exceeds maximum allowed');
    }

    const validatedBody = audioChunkSchema.parse({
      chunkNumber: Number(req.body.chunkNumber),
      isLastChunk: req.body.isLastChunk === 'true',
      metadata: {
        size: req.file.size,
        type: req.file.mimetype,
        timestamp: new Date().toISOString(),
      },
    });

    req.validatedChunk = validatedBody;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(400, 'Invalid chunk data: ' + error.errors[0].message);
    }
    throw error;
  }
};
