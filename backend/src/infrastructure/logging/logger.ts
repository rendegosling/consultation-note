import winston from 'winston';

// Declare the global type for request ID
declare global {
  let requestId: string | undefined;
}

// Ensure TypeScript knows about the global variable
const globalWithRequestId = global as typeof global & { requestId?: string };

// Define the log method type
type LogMethod = (
  component: string,
  message: string,
  metadata?: Record<string, string | number | boolean | null | undefined>
) => void;

interface WinstonLogInfo {
  timestamp?: string;
  level: string;
  component?: string;
  message: string;
  [key: string]: string | number | boolean | null | undefined | Array<string | number | boolean | null | undefined> | unknown;
}

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf((info) => {
    const { timestamp, level, component, message, ...metadata } = info as WinstonLogInfo;
    return JSON.stringify({
      timestamp,
      level,
      component,
      message,
      service: 'consultation-backend',
      environment: process.env.NODE_ENV,
      ...metadata,
      ...(globalWithRequestId.requestId && { requestId: globalWithRequestId.requestId }),
    });
  }),
);

// Standard severity levels
const logLevels = {
  fatal: 0, // Application is unusable, immediate action required
  error: 1, // Runtime errors that break functionality
  warn: 2, // Runtime situations that might cause problems
  info: 3, // Important state changes and business events
  debug: 4, // Debugging information
  trace: 5, // Very detailed debugging traces
};

// Create a custom logger type that enforces our log entry structure
interface CustomLogger {
  fatal: LogMethod;
  error: LogMethod;
  warn: LogMethod;
  info: LogMethod;
  debug: LogMethod;
  trace: LogMethod;
}

// Create the logger with proper typing
const winstonLogger = winston.createLogger({
  levels: logLevels,
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: logFormat,
  transports: [new winston.transports.Console()],
});

// Wrap Winston logger to enforce our structure
export const logger: CustomLogger = {
  fatal: (component, message, metadata) =>
    winstonLogger.log('fatal', { component, message, ...metadata }),
  error: (component, message, metadata) =>
    winstonLogger.log('error', { component, message, ...metadata }),
  warn: (component, message, metadata) =>
    winstonLogger.log('warn', { component, message, ...metadata }),
  info: (component, message, metadata) =>
    winstonLogger.log('info', { component, message, ...metadata }),
  debug: (component, message, metadata) =>
    winstonLogger.log('debug', { component, message, ...metadata }),
  trace: (component, message, metadata) =>
    winstonLogger.log('trace', { component, message, ...metadata }),
};

// Ensure errors are properly serialized
winstonLogger.exceptions.handle(
  new winston.transports.Console({
    format: logFormat,
  }),
);
