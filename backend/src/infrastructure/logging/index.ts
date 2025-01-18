import { WinstonProvider } from './providers/winston.provider';
import { LoggerService } from './logger.service';

const provider = new WinstonProvider();
export const logger = new LoggerService(provider); 