import { Pinecone } from '@pinecone-database/pinecone';
import { IVectorStoreRepository, SearchResult } from '../../domain/repositories/IVectorStoreRepository';
import { DocumentChunk } from '../../domain/entities/Document';
import { env } from '../config/env';

export class PineconeVectorStoreRepository implements IVectorStoreRepository {
  private client: Pinecone;
  private indexName: string;

  constructor() {
    this.client = new Pinecone({ apiKey: env.PINECONE_API_KEY });
    this.indexName = env.PINECONE_INDEX_NAME;
  }

  private getIndex() {
    return this.client.index(this.indexName);
  }

  async upsertChunks(chunks: DocumentChunk[], embeddings: number[][]): Promise<void> {
    const index = this.getIndex();

    const vectors = chunks.map((chunk, i) => ({
      id: chunk.id,
      values: embeddings[i],
      metadata: {
        content: chunk.content,
        documentId: chunk.metadata.documentId,
        documentName: chunk.metadata.documentName,
        chunkIndex: chunk.metadata.chunkIndex,
        totalChunks: chunk.metadata.totalChunks,
      }
    }));

    // Upsert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
    }
  }

  async searchSimilar(queryEmbedding: number[], topK: number): Promise<SearchResult[]> {
    const index = this.getIndex();

    const response = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    return (response.matches || []).map(match => ({
      chunk: {
        id: match.id,
        content: (match.metadata?.content as string) || '',
        metadata: {
          documentId: (match.metadata?.documentId as string) || '',
          documentName: (match.metadata?.documentName as string) || '',
          chunkIndex: (match.metadata?.chunkIndex as number) || 0,
          totalChunks: (match.metadata?.totalChunks as number) || 0,
        }
      },
      score: match.score || 0
    }));
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    const index = this.getIndex();
    await index.deleteMany({ documentId });
  }
}
