import { Request, Response } from 'express';
import { UploadAudioChunkCommandHandler } from './command.handler';
import { logger } from '@/infrastructure/logging';
import { AppError } from '@/infrastructure/middleware';
import { ConsultationNotFound, AudioChunkUploadFailed } from '../errors';

const COMPONENT_NAME = 'UploadAudioChunkController';

export class UploadAudioChunkController {
  constructor(private readonly commandHandler: UploadAudioChunkCommandHandler) {}

  async handle(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { chunkNumber, isLastChunk } = req.validatedChunk!;
    const file = req.file!;

    try {
      await this.commandHandler.execute({
        sessionId: id,
        chunkNumber,
        isLastChunk,
        file
      });

      logger.info(COMPONENT_NAME, 'Audio chunk processed', {
        sessionId: id,
        chunkNumber,
        isLastChunk
      });

      return res.status(202).json({
        status: 'success',
        data: { sessionId: id }
      });

    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to process audio chunk', {
        sessionId: id,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof ConsultationNotFound || 
          error instanceof AudioChunkUploadFailed) {
        throw error;
      }
      throw new AppError(500, 'Failed to process audio chunk');
    }
  }
}