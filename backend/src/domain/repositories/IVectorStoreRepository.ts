import { DocumentChunk } from '../entities/Document';

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
}

export interface IVectorStoreRepository {
  upsertChunks(chunks: DocumentChunk[], embeddings: number[][]): Promise<void>;
  searchSimilar(queryEmbedding: number[], topK: number): Promise<SearchResult[]>;
  deleteByDocumentId(documentId: string): Promise<void>;
}
