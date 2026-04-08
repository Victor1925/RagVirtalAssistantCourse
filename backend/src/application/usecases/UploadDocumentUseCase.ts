import { Document, DocumentChunk } from '../../domain/entities/Document';
import { IVectorStoreRepository } from '../../domain/repositories/IVectorStoreRepository';
import { IDocumentRepository } from '../../domain/repositories/IDocumentRepository';
import { ILLMService } from '../../domain/services/ILLMService';
import { UploadDocumentDto, UploadDocumentResponseDto } from '../dto';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../infrastructure/config/env';

export class UploadDocumentUseCase {
  constructor(
    private readonly vectorStoreRepository: IVectorStoreRepository,
    private readonly documentRepository: IDocumentRepository,
    private readonly llmService: ILLMService,
    private readonly pdfProcessingService: { extractText(buffer: Buffer): Promise<string> }
  ) {}

  async execute(dto: UploadDocumentDto): Promise<UploadDocumentResponseDto> {
    // Extract text from PDF
    const textContent = await this.pdfProcessingService.extractText(dto.fileBuffer);

    // Create document entity
    const document = Document.create(dto.fileName, textContent, dto.mimeType);

    // Split into chunks
    const chunks = this.splitIntoChunks(
      textContent,
      document.id,
      document.name,
      env.CHUNK_SIZE,
      env.CHUNK_OVERLAP
    );
    document.chunks = chunks;

    // Generate embeddings for all chunks
    const chunkTexts = chunks.map(c => c.content);
    const embeddingResult = await this.llmService.generateEmbeddings(chunkTexts);

    // Store in vector store
    await this.vectorStoreRepository.upsertChunks(chunks, embeddingResult.embeddings);

    // Save document metadata
    await this.documentRepository.save(document);

    return {
      documentId: document.id,
      documentName: document.name,
      chunksCreated: chunks.length,
      message: `Document "${document.name}" processed successfully with ${chunks.length} chunks.`
    };
  }

  private splitIntoChunks(
    text: string,
    documentId: string,
    documentName: string,
    chunkSize: number,
    chunkOverlap: number
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const sentences = text.replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/);

    let currentChunk = '';
    let chunkIndex = 0;

    for (const sentence of sentences) {
      if ((currentChunk + ' ' + sentence).length > chunkSize && currentChunk.length > 0) {
        chunks.push({
          id: uuidv4(),
          content: currentChunk.trim(),
          metadata: {
            documentId,
            documentName,
            chunkIndex,
            totalChunks: 0, // will be updated
          }
        });

        // Keep overlap
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(chunkOverlap / 5));
        currentChunk = overlapWords.join(' ') + ' ' + sentence;
        chunkIndex++;
      } else {
        currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        id: uuidv4(),
        content: currentChunk.trim(),
        metadata: {
          documentId,
          documentName,
          chunkIndex,
          totalChunks: 0,
        }
      });
    }

    // Update total chunks count
    chunks.forEach(chunk => {
      chunk.metadata.totalChunks = chunks.length;
    });

    return chunks;
  }
}
