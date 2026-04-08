import { Mistral } from '@mistralai/mistralai';
import { ILLMService, EmbeddingResult, GenerationResult } from '../../domain/services/ILLMService';
import { env } from '../config/env';

export class MistralLLMService implements ILLMService {
  private client: Mistral;

  constructor() {
    this.client = new Mistral({ apiKey: env.MISTRAL_API_KEY });
  }

  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult> {
    const response = await this.client.embeddings.create({
      model: env.MISTRAL_EMBED_MODEL,
      inputs: texts,
    });

    const embeddings = response.data.map((item: any) => item.embedding as number[]);

    return {
      embeddings,
      model: env.MISTRAL_EMBED_MODEL
    };
  }

  async generateResponse(
    systemPrompt: string,
    userMessage: string,
    context: string
  ): Promise<GenerationResult> {
    const contextualMessage = `Based on the following context, please answer the question.

CONTEXT:
${context}

QUESTION: ${userMessage}`;

    const response = await this.client.chat.complete({
      model: env.MISTRAL_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contextualMessage }
      ],
      temperature: 0.1,
      maxTokens: 2048,
    });

    const choice = response.choices?.[0];
    if (!choice || !choice.message?.content) {
      throw new Error('No response from Mistral');
    }

    const content = typeof choice.message.content === 'string'
      ? choice.message.content
      : choice.message.content.map((c: any) => c.type === 'text' ? c.text : '').join('');

    return {
      content,
      model: env.MISTRAL_MODEL,
      usage: response.usage ? {
        promptTokens: response.usage.promptTokens ?? 0,
        completionTokens: response.usage.completionTokens ?? 0,
        totalTokens: response.usage.totalTokens ?? 0,
      } : undefined
    };
  }
}
