export interface APIResponse<T> {
  data?: T;
  error?: string;
  metadata?: {
    requestId: string;
    timestamp: string;
  };
}

export interface APIErrorResponse {
  error: string;
  metadata?: {
    requestId: string;
    timestamp: string;
  };
} 