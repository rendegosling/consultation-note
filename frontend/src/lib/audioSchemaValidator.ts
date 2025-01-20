import { z } from 'zod';
import { config } from '@/config/app.config';

export const audioChunkSchema = z.object({
  chunk: z.instanceof(Blob),
  chunkNumber: z.number().positive(),
  isLastChunk: z.boolean(),
  size: z.number().min(0),
  type: z.string(),
  timestamp: z.string()
});

export type ValidatedAudioChunk = z.infer<typeof audioChunkSchema>; 