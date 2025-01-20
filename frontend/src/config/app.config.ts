export interface AudioConfig {
  chunkSize: number;      // in milliseconds
  maxDuration: number;    // in milliseconds
  maxChunkSize: number;   // in bytes
  allowedMimeTypes: string[];
}

export interface ApiConfig {
  url: string;
  endpoints: {
    sessions: string;
    chunks: string;
    notes: string;
  };
}

export interface LogConfig {
  level: string;
  service: string;
}

export interface AuthConfig {
  username: string;
  password: string;
}

export interface AppConfig {
  environment: 'development' | 'staging' | 'production';
  audio: AudioConfig;
  api: ApiConfig;
  logging: LogConfig;
  auth: AuthConfig;
}

export const config: AppConfig = {
  environment: (process.env.NEXT_PUBLIC_NODE_ENV || 'development') as AppConfig['environment'],
  
  audio: {
    chunkSize: parseInt(process.env.NEXT_PUBLIC_AUDIO_CHUNK_SIZE || '15000'),
    maxDuration: parseInt(process.env.NEXT_PUBLIC_MAX_AUDIO_DURATION || '3600000'),
    maxChunkSize: parseInt(process.env.NEXT_PUBLIC_MAX_CHUNK_SIZE || '2097152'),
    allowedMimeTypes: [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg',
      'audio/wav'
    ]
  },

  api: {
    url: process.env.NEXT_PUBLIC_CONSULTATION_API_URL || 'http://backend:5000',
    endpoints: {
      sessions: '/api/sessions',
      chunks: '/api/sessions/:sessionId/chunks',
      notes: '/api/sessions/:sessionId/notes'
    }
  },

  logging: {
    level: process.env.NEXT_PUBLIC_LOG_LEVEL || 'debug',
    service: 'consultation-frontend'
  },

  auth: {
    username: process.env.NEXT_PUBLIC_AUTH_USERNAME || 'admin',
    password: process.env.NEXT_PUBLIC_AUTH_PASSWORD || 'password'
  }
}; 