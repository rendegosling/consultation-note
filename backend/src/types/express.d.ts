import { ValidatedAudioChunk } from '../infrastructure/audio/validators/chunk-upload';
import { Multer } from 'multer';

declare global {
  namespace Express {
    interface Request {
      validatedChunk?: ValidatedAudioChunk;
      file?: Express.Multer.File;
    }
  }
}

export {}; 