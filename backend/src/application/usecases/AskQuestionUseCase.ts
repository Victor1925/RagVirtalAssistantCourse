import { IVectorStoreRepository } from '../../domain/repositories/IVectorStoreRepository';
import { ILLMService } from '../../domain/services/ILLMService';
import { AskQuestionDto, AskQuestionResponseDto } from '../dto';
import { env } from '../../infrastructure/config/env';
import { v4 as uuidv4 } from 'uuid';

const SYSTEM_PROMPT = `You are a helpful AI assistant that answers questions based on the provided context documents.

Instructions:
- Answer questions using ONLY the information provided in the context.
- If the context doesn't contain enough information to answer the question, say so clearly.
- Be concise but thorough in your responses.
- When referencing information, mention which document it comes from if known.
- Always respond in the same language as the user's question.`;

export class AskQuestionUseCase {
  constructor(
    private readonly vectorStoreRepository: IVectorStoreRepository,
    private readonly llmService: ILLMService
  ) {}

  async execute(dto: AskQuestionDto): Promise<AskQuestionResponseDto> {
    const sessionId = dto.sessionId || uuidv4();

    // Generate embedding for the question
    const embeddingResult = await this.llmService.generateEmbeddings([dto.question]);
    const queryEmbedding = embeddingResult.embeddings[0];

    // Retrieve relevant chunks
    const searchResults = await this.vectorStoreRepository.searchSimilar(
      queryEmbedding,
      env.TOP_K_RESULTS
    );

    if (searchResults.length === 0) {
      return {
        answer: "I don't have any documents in my knowledge base yet. Please upload some PDF documents first.",
        sources: [],
        sessionId
      };
    }

    // Build context from retrieved chunks
    const context = searchResults
      .map((result, i) =>
        `[Source ${i + 1} - ${result.chunk.metadata.documentName}]:\n${result.chunk.content}`
      )
      .join('\n\n---\n\n');

    // Generate response
    const generationResult = await this.llmService.generateResponse(
      SYSTEM_PROMPT,
      dto.question,
      context
    );

    // Build sources
    const sources = searchResults.map(result => ({
      documentName: result.chunk.metadata.documentName,
      chunkIndex: result.chunk.metadata.chunkIndex,
      score: result.score,
      excerpt: result.chunk.content.substring(0, 200) + (result.chunk.content.length > 200 ? '...' : '')
    }));

    return {
      answer: generationResult.content,
      sources,
      sessionId
    };
  }
}
