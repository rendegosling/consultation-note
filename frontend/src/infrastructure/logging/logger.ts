type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMessage {
  message: string;
  metadata?: Record<string, any>;
  timestamp: string;
  level: LogLevel;
  component: string;
  sessionId?: string;
  chunkNumber?: number;
}

const formatLog = (logData: LogMessage): string => {
  const { level, component, message, metadata, timestamp, sessionId, chunkNumber } = logData;
  const context = sessionId ? `[${sessionId}${chunkNumber ? `:${chunkNumber}` : ''}] ` : '';
  return `[${timestamp}] [${level.toUpperCase()}] [${component}] ${context}${message} ${
    metadata ? JSON.stringify(metadata, null, 2) : ''
  }`;
};

export const logger = {
  info: (component: string, message: string, metadata?: Record<string, any>) => {
    const logData: LogMessage = {
      message,
      metadata,
      timestamp: new Date().toISOString(),
      level: 'info',
      component,
      sessionId: metadata?.sessionId,
      chunkNumber: metadata?.chunkNumber,
    };
    console.log(formatLog(logData));
  },
  error: (component: string, message: string, metadata?: Record<string, any>) => {
    const logData: LogMessage = {
      message,
      metadata,
      timestamp: new Date().toISOString(),
      level: 'error',
      component,
      sessionId: metadata?.sessionId,
      chunkNumber: metadata?.chunkNumber,
    };
    console.error(formatLog(logData));
  }
};