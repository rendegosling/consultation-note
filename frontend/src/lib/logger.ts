interface LogMetadata {
  [key: string]: any;
}

const formatLog = (component: string, message: string, metadata?: LogMetadata) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level: metadata?.level || 'info',
    component,
    message,
    service: 'consultation-frontend',
    environment: process.env.NODE_ENV,
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
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatLog(component, message, metadata));
    }
  }
};