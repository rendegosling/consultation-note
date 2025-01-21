import { Request, Response } from 'express';
import { logger } from '@/infrastructure/logging';
import { AudioToTextCommandHandler } from './command.handler';
import { z } from 'zod';

const COMPONENT_NAME = 'AudioToTextController';

const requestSchema = z.object({
  audioUrl: z.string().url(),
});

export class AudioToTextController {
  constructor(
    private readonly commandHandler: AudioToTextCommandHandler
  ) {}

  async transcribe(req: Request, res: Response) {
    try {
      const validatedBody = requestSchema.parse(req.body);

      const result = await this.commandHandler.execute({
        audioUrl: validatedBody.audioUrl
      });

      logger.info(COMPONENT_NAME, 'Audio transcribed successfully');

      return res.status(200).json(result);
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to transcribe audio', {
        error: error instanceof Error ? error.message : String(error)
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to transcribe audio'
      });
    }
  }
}