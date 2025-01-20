import { config } from '@/config/app.config';

export const API_ENDPOINTS = {
  CONSULTATIONS: {
    SESSIONS: {
      CREATE: '/consultations/sessions',
      GET: (id: string) => `/consultations/sessions/${id}`,
      UPDATE_STATUS: (id: string) => `/consultations/sessions/${id}/status`,
      SUMMARY: (id: string) => `/consultations/sessions/${id}/summary`,
    },
    CHUNKS: {
      UPLOAD: (sessionId: string) => `/consultations/sessions/${sessionId}/chunks`,
    },
    NOTES: {
      CREATE: (sessionId: string) => `/consultations/sessions/${sessionId}/notes`,
    }
  }
} as const;

export const buildApiUrl = (endpoint: string): string => {
  return `${config.api.url}${endpoint}`;
}; 