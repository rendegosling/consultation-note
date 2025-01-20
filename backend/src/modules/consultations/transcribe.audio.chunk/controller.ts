import { Request, Response } from 'express';
import { TranscribeAudioChunkCommandHandler } from './command.handler';
import { logger } from '@/infrastructure/logging';
import { AppError } from '@/infrastructure/middleware';

const COMPONENT_NAME = 'TranscribeAudioChunkController';

export class TranscribeAudioChunkController {
  constructor(
    private readonly commandHandler: TranscribeAudioChunkCommandHandler
  ) {}

  async handle(req: Request, res: Response): Promise<void> {
    const { sessionId } = req.params;
    const { chunkNumber, s3Key } = req.body;

    try {
      const result = await this.commandHandler.execute({
        sessionId,
        chunkNumber,
        s3Key
      });

      if (!result) {
        res.status(200).json({ message: 'Chunk skipped - already processed' });
        return;
      }

      res.status(200).json({
        message: 'Chunk transcribed successfully',
        data: result
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to transcribe audio chunk', {
        sessionId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new AppError(500, 'Failed to transcribe audio chunk');
    }
  }
}