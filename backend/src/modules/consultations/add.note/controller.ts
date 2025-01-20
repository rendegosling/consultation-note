import { Request, Response } from 'express';
import { logger } from '@/infrastructure/logging';
import { AddNoteCommandHandler } from './command.handler';
import { z } from 'zod';

const COMPONENT_NAME = 'AddNoteController';

export class AddNoteController {
  constructor(
    private readonly commandHandler: AddNoteCommandHandler
  ) {}

  async handle(req: Request, res: Response) {
    const { sessionId } = req.params;
    const { note } = req.body;
    
    try {
      const result = await this.commandHandler.execute({
        sessionId,
        note,
      });

      logger.info(COMPONENT_NAME, 'Note added successfully', {
        sessionId,
        noteId: result.id,
      });

      return res.status(201).json(result);
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to add note', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to add note',
      });
    }
  }
}