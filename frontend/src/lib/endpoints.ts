export const API_ENDPOINTS = {
  CONSULTATIONS: {
    SESSIONS: {
      CREATE: '/consultations/sessions',
      GET: (id: string) => `/consultations/sessions/${id}`,
      UPDATE_STATUS: (id: string) => `/consultations/sessions/${id}/status`,
    },
    CHUNKS: {
      UPLOAD: (sessionId: string) => `/consultations/sessions/${sessionId}/chunks`,
    }
  }
} as const;

// Type-safe URL builder
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_CONSULTATION_API_URL || 'http://backend:5000';
  return `${baseUrl}${endpoint}`;
}; 