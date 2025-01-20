import { z } from 'zod';
import { config } from '@/config/app.config';

export const audioChunkSchema = z.object({
  chunk: z.instanceof(Blob, { 
    message: 'Audio chunk is required',
  }).refine(
    (blob) => blob.size <= config.audio.maxChunkSize,
    `Chunk size exceeds maximum allowed (${config.audio.maxChunkSize} bytes)`
  ),
  chunkNumber: z.number().positive('Chunk number must be positive'),
  isLastChunk: z.boolean(),
  metadata: z.object({
    size: z.number().max(config.audio.maxChunkSize, 'File too large'),
    type: z.string()
      .refine(
        (type) => config.audio.allowedMimeTypes.includes(type),
        `Invalid audio format. Allowed types: ${config.audio.allowedMimeTypes.join(', ')}`
      ),
    timestamp: z.string().datetime()
  })
});

export type ValidatedAudioChunk = z.infer<typeof audioChunkSchema>; 