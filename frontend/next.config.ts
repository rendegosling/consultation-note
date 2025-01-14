import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_AUDIO_CHUNK_SIZE: process.env.NEXT_PUBLIC_AUDIO_CHUNK_SIZE || '15000',
    NEXT_PUBLIC_MAX_AUDIO_DURATION: process.env.NEXT_PUBLIC_MAX_AUDIO_DURATION || '3600000',
    NEXT_PUBLIC_MAX_CHUNK_SIZE: process.env.NEXT_PUBLIC_MAX_CHUNK_SIZE || '2097152',
    POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
    POSTGRES_DB: process.env.POSTGRES_DB || 'consultation_note',
    POSTGRES_USER: process.env.POSTGRES_USER || 'myuser',
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'mypassword',
  }
};

export default nextConfig;
