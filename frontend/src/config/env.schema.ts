import { z } from 'zod';

export const envSchema = z.object({
  NEXT_PUBLIC_AUDIO_CHUNK_SIZE: z.string().transform(Number),
  NEXT_PUBLIC_MAX_AUDIO_DURATION: z.string().transform(Number),
  NEXT_PUBLIC_MAX_CHUNK_SIZE: z.string().transform(Number),
});

export type EnvVariables = z.infer<typeof envSchema>; 