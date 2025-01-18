import winston from 'winston';
import { LogProvider, LogLevel, LogMetadata } from '../types/logger.types';

export class WinstonProvider implements LogProvider {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { 
        service: 'consultation-backend',
        environment: process.env.NODE_ENV 
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  log(level: LogLevel, component: string, message: string, metadata?: LogMetadata): void {
    this.logger[level]({ component, message, ...metadata });
  }
} 