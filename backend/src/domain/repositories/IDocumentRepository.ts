import { Document } from '../entities/Document';

export interface IDocumentRepository {
  save(document: Document): Promise<void>;
  findById(id: string): Promise<Document | null>;
  findAll(): Promise<Document[]>;
  delete(id: string): Promise<void>;
}
