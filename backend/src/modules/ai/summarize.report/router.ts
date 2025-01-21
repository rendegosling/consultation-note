import { Router } from 'express';
import { SummarizeReportController } from './controller';
import { SummarizeReportCommandHandler } from './command.handler';

export function createSummarizeReportRouter(): Router {
  const router = Router();
  
  const commandHandler = new SummarizeReportCommandHandler();
  const controller = new SummarizeReportController(commandHandler);

  router.post(
    '/ai/summarize-report',
    controller.summarize.bind(controller)
  );

  return router;
}