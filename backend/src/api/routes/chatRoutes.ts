import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';

export function createChatRoutes(controller: ChatController): Router {
  const router = Router();

  router.post('/ask', (req, res, next) => controller.ask(req, res, next));

  return router;
}
