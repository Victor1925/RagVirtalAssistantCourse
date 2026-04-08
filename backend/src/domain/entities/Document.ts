export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    documentId: string;
    documentName: string;
    chunkIndex: number;
    totalChunks: number;
    pageNumber?: number;
  };
  embedding?: number[];
}

export class Document {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly content: string,
    public readonly mimeType: string,
    public readonly uploadedAt: Date,
    public chunks: DocumentChunk[] = []
  ) {}

  static create(name: string, content: string, mimeType: string): Document {
    const { v4: uuidv4 } = require('uuid');
    return new Document(
      uuidv4(),
      name,
      content,
      mimeType,
      new Date()
    );
  }
}
