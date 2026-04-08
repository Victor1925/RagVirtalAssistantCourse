import { Document } from '../../domain/entities/Document';
import { IDocumentRepository } from '../../domain/repositories/IDocumentRepository';

export class InMemoryDocumentRepository implements IDocumentRepository {
  private documents: Map<string, Document> = new Map();

  async save(document: Document): Promise<void> {
    this.documents.set(document.id, document);
  }

  async findById(id: string): Promise<Document | null> {
    return this.documents.get(id) || null;
  }

  async findAll(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async delete(id: string): Promise<void> {
    this.documents.delete(id);
  }
}
