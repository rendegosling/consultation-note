import { z } from 'zod';
import { env } from '@/config/env';

export const audioChunkSchema = z.object({
  chunk: z.instanceof(Blob, { 
    message: 'Audio chunk is required',
  }).refine(
    (blob) => blob.size <= Number(process.env.NEXT_PUBLIC_MAX_CHUNK_SIZE),
    'Chunk size exceeds maximum allowed (2MB)'
  ),
  chunkNumber: z.number().positive('Chunk number must be positive'),
  isLastChunk: z.boolean(),
  metadata: z.object({
    size: z.number().max(Number(process.env.NEXT_PUBLIC_MAX_CHUNK_SIZE), 'File too large'),
    type: z.string().startsWith('audio/', 'Invalid audio format'),
    timestamp: z.string().datetime()
  })
});

export type ValidatedAudioChunk = z.infer<typeof audioChunkSchema>; 