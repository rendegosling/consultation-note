import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../infrastructure/middleware/error-handler';

// Constants should come from environment variables
const MAX_CHUNK_SIZE = process.env.MAX_CHUNK_SIZE || 2 * 1024 * 1024; // 2MB default
const ALLOWED_MIME_TYPES = ['audio/webm', 'audio/ogg', 'audio/wav'];

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
    size: z.number().max(Number(MAX_CHUNK_SIZE), 'File too large'),
    type: z
      .string()
      .refine(
        (type) => ALLOWED_MIME_TYPES.includes(type),
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
    // Validate file presence and size
    if (!req.file) {
      throw new AppError(400, 'No audio chunk provided');
    }

    if (req.file.size > Number(MAX_CHUNK_SIZE)) {
      throw new AppError(400, 'Chunk size exceeds maximum allowed');
    }

    // Validate body parameters
    const validatedBody = audioChunkSchema.parse({
      chunkNumber: Number(req.body.chunkNumber),
      isLastChunk: req.body.isLastChunk === 'true',
      metadata: {
        size: req.file.size,
        type: req.file.mimetype,
        timestamp: new Date().toISOString(),
      },
    });

    // Attach validated data to request
    req.validatedChunk = validatedBody;

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(400, 'Invalid chunk data: ' + error.errors[0].message);
    }
    throw error;
  }
};
