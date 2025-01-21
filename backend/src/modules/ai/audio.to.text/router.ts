import { Router } from 'express';
import { AudioToTextController } from './controller';
import { AudioToTextCommandHandler } from './command.handler';

export function createAudioToTextRouter(): Router {
  const router = Router();
  
  const commandHandler = new AudioToTextCommandHandler();
  const controller = new AudioToTextController(commandHandler);

  router.post(
    '/ai/audio-to-text',
    controller.transcribe.bind(controller)
  );

  return router;
}