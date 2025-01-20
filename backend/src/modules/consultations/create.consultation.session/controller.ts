import { Request, Response } from 'express';
import { CreateConsultationSessionCommandHandler } from './command.handler';
import { logger } from '@/infrastructure/logging';
import { AppError } from '@/infrastructure/middleware';

const COMPONENT_NAME = 'CreateConsultationSessionController';

export class CreateConsultationSessionController {
  constructor(
    private readonly commandHandler: CreateConsultationSessionCommandHandler
  ) {}

  async handle(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.commandHandler.execute({
        metadata: req.body.metadata
      });

      res.status(201).json({
        session: result.session.toJSON()
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to create consultation session', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new AppError(500, 'Failed to create consultation session');
    }
  }
}