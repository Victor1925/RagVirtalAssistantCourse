export interface EmbeddingResult {
  embeddings: number[][];
  model: string;
}

export interface GenerationResult {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ILLMService {
  generateEmbeddings(texts: string[]): Promise<EmbeddingResult>;
  generateResponse(
    systemPrompt: string,
    userMessage: string,
    context: string
  ): Promise<GenerationResult>;
}
