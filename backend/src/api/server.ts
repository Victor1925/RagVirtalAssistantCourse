import express from 'express';
import cors from 'cors';
import path from 'path';
import { validateEnv, env } from '../infrastructure/config/env';

// Infrastructure
import { MistralLLMService } from '../infrastructure/mistral/MistralLLMService';
import { PineconeVectorStoreRepository } from '../infrastructure/pinecone/PineconeVectorStoreRepository';
import { PDFProcessingService } from '../infrastructure/pdf/PDFProcessingService';
import { InMemoryDocumentRepository } from '../infrastructure/repositories/InMemoryDocumentRepository';

// Application
import { UploadDocumentUseCase } from '../application/usecases/UploadDocumentUseCase';
import { AskQuestionUseCase } from '../application/usecases/AskQuestionUseCase';

// API
import { DocumentController } from './controllers/DocumentController';
import { ChatController } from './controllers/ChatController';
import { createDocumentRoutes } from './routes/documentRoutes';
import { createChatRoutes } from './routes/chatRoutes';
import { errorHandler } from './middleware/errorHandler';

// Validate environment
validateEnv();

// Initialize infrastructure
const llmService = new MistralLLMService();
const vectorStoreRepository = new PineconeVectorStoreRepository();
const pdfProcessingService = new PDFProcessingService();
const documentRepository = new InMemoryDocumentRepository();

// Initialize use cases
const uploadDocumentUseCase = new UploadDocumentUseCase(
  vectorStoreRepository,
  documentRepository,
  llmService,
  pdfProcessingService
);

const askQuestionUseCase = new AskQuestionUseCase(
  vectorStoreRepository,
  llmService
);

// Initialize controllers
const documentController = new DocumentController(uploadDocumentUseCase, documentRepository);
const chatController = new ChatController(askQuestionUseCase);

// Create Express app
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../../frontend')));

// API routes
app.use('/api/documents', createDocumentRoutes(documentController));
app.use('/api/chat', createChatRoutes(chatController));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../frontend/index.html'));
});

// Error handler
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`RAG Assistant server running on port ${env.PORT}`);
  console.log(`Frontend: http://localhost:${env.PORT}`);
  console.log(`API: http://localhost:${env.PORT}/api`);
});

export default app;
