import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_AUDIO_CHUNK_SIZE: process.env.NEXT_PUBLIC_AUDIO_CHUNK_SIZE || '15000',
    NEXT_PUBLIC_MAX_AUDIO_DURATION: process.env.NEXT_PUBLIC_MAX_AUDIO_DURATION || '3600000',
  }
};

export default nextConfig;
