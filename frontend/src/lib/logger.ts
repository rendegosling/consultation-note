import { config } from '@/config';

interface LogMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

const formatLog = (component: string, message: string, metadata?: LogMetadata) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level: metadata?.level || config.logging.level,
    component,
    message,
    service: config.logging.service,
    environment: config.environment,
    correlationId: metadata?.correlationId || crypto.randomUUID(),
    ...metadata
  });
};

export const logger = {
  info: (component: string, message: string, metadata?: LogMetadata) => {
    console.log(formatLog(component, message, metadata));
  },
  error: (component: string, message: string, metadata?: LogMetadata) => {
    console.error(formatLog(component, message, metadata));
  },
  warn: (component: string, message: string, metadata?: LogMetadata) => {
    console.warn(formatLog(component, message, metadata));
  },
  debug: (component: string, message: string, metadata?: LogMetadata) => {
    if (config.environment === 'development') {
      console.debug(formatLog(component, message, metadata));
    }
  }
};