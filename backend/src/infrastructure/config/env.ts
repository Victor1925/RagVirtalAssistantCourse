import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PINECONE_API_KEY: process.env.PINECONE_API_KEY || '',
  PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'testindname',
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || '',
  PORT: parseInt(process.env.PORT || '3000', 10),
  MISTRAL_MODEL: process.env.MISTRAL_MODEL || 'mistral-medium-latest',
  MISTRAL_EMBED_MODEL: process.env.MISTRAL_EMBED_MODEL || 'mistral-embed',
  CHUNK_SIZE: parseInt(process.env.CHUNK_SIZE || '1000', 10),
  CHUNK_OVERLAP: parseInt(process.env.CHUNK_OVERLAP || '200', 10),
  TOP_K_RESULTS: parseInt(process.env.TOP_K_RESULTS || '5', 10),
};

export function validateEnv(): void {
  const required = ['PINECONE_API_KEY', 'MISTRAL_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
