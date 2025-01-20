import { Request, Response } from 'express';
import { GenerateSummaryCommandHandler, GenerateSummaryCommand } from './command.handler';
import { logger } from '@/infrastructure/logging';

const COMPONENT_NAME = 'GenerateSummaryController';

export class GenerateSummaryController {
  constructor(
    private readonly generateSummaryCommandHandler: GenerateSummaryCommandHandler
  ) {}

  async generateSummary(req: Request, res: Response): Promise<void> {
    const { sessionId } = req.params;

    try {
      const command: GenerateSummaryCommand = { sessionId };
      const result = await this.generateSummaryCommandHandler.execute(command);
      
      res.status(200).json({
        message: 'Summary generation completed',
        url: result.url,
        generatedAt: result.generatedAt
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to handle generate summary request', {
        sessionId,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Failed to generate summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}