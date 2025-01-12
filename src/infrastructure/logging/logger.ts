type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMessage {
  message: string;
  metadata?: Record<string, any>;
  timestamp: string;
  level: LogLevel;
  component: string;
}

const formatLog = (logData: LogMessage): string => {
  const { level, component, message, metadata, timestamp } = logData;
  return `[${timestamp}] [${level.toUpperCase()}] [${component}] ${message} ${
    metadata ? JSON.stringify(metadata) : ''
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
    };
    console.error(formatLog(logData));
  }
};