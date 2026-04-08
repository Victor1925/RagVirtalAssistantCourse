import { Request, Response, NextFunction } from 'express';
import { UploadDocumentUseCase } from '../../application/usecases/UploadDocumentUseCase';
import { IDocumentRepository } from '../../domain/repositories/IDocumentRepository';

export class DocumentController {
  constructor(
    private readonly uploadDocumentUseCase: UploadDocumentUseCase,
    private readonly documentRepository: IDocumentRepository
  ) {}

  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const result = await this.uploadDocumentUseCase.execute({
        fileName: req.file.originalname,
        fileBuffer: req.file.buffer,
        mimeType: req.file.mimetype,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async listDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const documents = await this.documentRepository.findAll();
      res.json({
        documents: documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          uploadedAt: doc.uploadedAt,
          chunksCount: doc.chunks.length,
        }))
      });
    } catch (error) {
      next(error);
    }
  }
}
