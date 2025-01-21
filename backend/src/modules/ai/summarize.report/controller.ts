import { Request, Response } from 'express';
import { logger } from '@/infrastructure/logging';
import { SummarizeReportCommandHandler } from './command.handler';
import { z } from 'zod';

const COMPONENT_NAME = 'SummarizeReportController';

const requestSchema = z.object({
  notes: z.array(z.string()),
  transcripts: z.array(z.string())
});

export class SummarizeReportController {
  constructor(
    private readonly commandHandler: SummarizeReportCommandHandler
  ) {}

  async summarize(req: Request, res: Response) {
    try {
      const validatedBody = requestSchema.parse(req.body);

      const result = await this.commandHandler.execute({
        notes: validatedBody.notes,
        transcripts: validatedBody.transcripts
      });

      logger.info(COMPONENT_NAME, 'Report summarized successfully', {
        summaryId: result.id
      });

      return res.status(200).json(result);
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to summarize report', {
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
        message: 'Failed to summarize report'
      });
    }
  }
}