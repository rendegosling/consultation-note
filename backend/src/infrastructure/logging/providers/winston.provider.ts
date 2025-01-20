import winston from 'winston';
import { LogProvider, LogLevel, LogMetadata } from '../types/logger.types';
import { config } from '@/config/app.config';

export class WinstonProvider implements LogProvider {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: config.logging.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { 
        service: config.logging.service,
        environment: config.environment 
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