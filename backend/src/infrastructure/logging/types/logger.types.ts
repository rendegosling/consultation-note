export type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';

export interface LogMetadata {
  [key: string]: any;
}

export interface LogProvider {
  log(level: LogLevel, component: string, message: string, metadata?: LogMetadata): void;
}

export interface Logger {
  error(component: string, message: string, metadata?: LogMetadata): void;
  warn(component: string, message: string, metadata?: LogMetadata): void;
  info(component: string, message: string, metadata?: LogMetadata): void;
  verbose(component: string, message: string, metadata?: LogMetadata): void;
  debug(component: string, message: string, metadata?: LogMetadata): void;
  silly(component: string, message: string, metadata?: LogMetadata): void;
}