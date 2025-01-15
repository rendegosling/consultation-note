import { ValidatedAudioChunk } from '../infrastructure/audio/validators/chunk-upload';

declare global {
  namespace Express {
    interface Request {
      validatedChunk?: ValidatedAudioChunk;
      file?: Express.Multer.File;
    }
  }
}

export {};
