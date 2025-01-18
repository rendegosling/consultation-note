import { Logger, LogProvider, LogMetadata } from './types/logger.types';

export class LoggerService implements Logger {
  constructor(private provider: LogProvider) {}

  error(component: string, message: string, metadata?: LogMetadata): void {
    this.provider.log('error', component, message, metadata);
  }

  warn(component: string, message: string, metadata?: LogMetadata): void {
    this.provider.log('warn', component, message, metadata);
  }

  info(component: string, message: string, metadata?: LogMetadata): void {
    this.provider.log('info', component, message, metadata);
  }

  debug(component: string, message: string, metadata?: LogMetadata): void {
    this.provider.log('debug', component, message, metadata);
  }

  verbose(component: string, message: string, metadata?: LogMetadata): void {
    this.provider.log('verbose', component, message, metadata);
  }

  silly(component: string, message: string, metadata?: LogMetadata): void {
    this.provider.log('silly', component, message, metadata);
  }
}