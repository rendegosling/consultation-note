import { envSchema } from './env.schema';

const processEnv = {
  NEXT_PUBLIC_AUDIO_CHUNK_SIZE: process.env.NEXT_PUBLIC_AUDIO_CHUNK_SIZE,
  NEXT_PUBLIC_MAX_AUDIO_DURATION: process.env.NEXT_PUBLIC_MAX_AUDIO_DURATION,
  NEXT_PUBLIC_MAX_CHUNK_SIZE: process.env.NEXT_PUBLIC_MAX_CHUNK_SIZE,
} as const;

const parsed = envSchema.safeParse(processEnv);

if (!parsed.success) {
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(parsed.error.format(), null, 2)
  );
  process.exit(1);
}

export const env = {
  audio: {
    chunkSize: parsed.data.NEXT_PUBLIC_AUDIO_CHUNK_SIZE,
    maxDuration: parsed.data.NEXT_PUBLIC_MAX_AUDIO_DURATION,
    maxChunkSize: parsed.data.NEXT_PUBLIC_MAX_CHUNK_SIZE,
  },
} as const; 