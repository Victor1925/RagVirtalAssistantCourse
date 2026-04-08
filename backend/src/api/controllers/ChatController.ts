import { Request, Response, NextFunction } from 'express';
import { AskQuestionUseCase } from '../../application/usecases/AskQuestionUseCase';

export class ChatController {
  constructor(
    private readonly askQuestionUseCase: AskQuestionUseCase
  ) {}

  async ask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { question, sessionId } = req.body;

      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        res.status(400).json({ error: 'Question is required' });
        return;
      }

      const result = await this.askQuestionUseCase.execute({
        question: question.trim(),
        sessionId
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
