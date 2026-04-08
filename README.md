# RAG Assistant

A production-ready Retrieval Augmented Generation (RAG) virtual assistant built with TypeScript, LangChain, Mistral AI, and Pinecone.

## Architecture

Domain-Driven Design (DDD) with API-first approach:

- **Backend**: TypeScript + Express
- **LLM & Embeddings**: Mistral AI (mistral-medium-latest + mistral-embed)
- **Vector Store**: Pinecone
- **Frontend**: Vanilla HTML/CSS/JS

## Project Structure

```
rag-assistant/
├── backend/
│   └── src/
│       ├── domain/           # Entities, Repository interfaces, Service interfaces
│       ├── application/      # Use cases, DTOs
│       ├── infrastructure/   # Pinecone, Mistral, PDF implementations
│       └── api/              # Express controllers, routes, middleware
├── frontend/                 # Static HTML/CSS/JS
├── Dockerfile
├── railway.json
└── README.md
```

## Setup

### Prerequisites

- Node.js 20+
- Pinecone account with an index (dimension: 1024 for mistral-embed)
- Mistral AI API key

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

| Variable              | Description                          | Default               |
|-----------------------|--------------------------------------|-----------------------|
| `PINECONE_API_KEY`    | Your Pinecone API key                | required              |
| `PINECONE_INDEX_NAME` | Pinecone index name                  | testindname           |
| `MISTRAL_API_KEY`     | Your Mistral AI API key              | required              |
| `PORT`                | Server port                          | 3000                  |
| `MISTRAL_MODEL`       | Mistral chat model                   | mistral-medium-latest |
| `MISTRAL_EMBED_MODEL` | Mistral embedding model              | mistral-embed         |
| `CHUNK_SIZE`          | Characters per document chunk        | 1000                  |
| `CHUNK_OVERLAP`       | Character overlap between chunks     | 200                   |
| `TOP_K_RESULTS`       | Number of chunks to retrieve per query | 5                   |

### Development

```bash
cd backend
npm run dev
```

Open http://localhost:3000 in your browser.

### Production Build

```bash
cd backend
npm run build
npm start
```

## API Endpoints

| Method | Path                     | Description               |
|--------|--------------------------|---------------------------|
| GET    | `/api/health`            | Health check              |
| POST   | `/api/documents/upload`  | Upload a PDF document     |
| GET    | `/api/documents`         | List uploaded documents   |
| POST   | `/api/chat/ask`          | Ask a question            |

### POST /api/documents/upload

Multipart form-data with a `file` field (PDF only, max 50MB).

**Response:**
```json
{
  "documentId": "uuid",
  "documentName": "filename.pdf",
  "chunksCreated": 12,
  "message": "Document processed successfully with 12 chunks."
}
```

### POST /api/chat/ask

```json
{
  "question": "What is the main topic of the document?",
  "sessionId": "optional-session-uuid"
}
```

**Response:**
```json
{
  "answer": "The document covers...",
  "sources": [
    {
      "documentName": "filename.pdf",
      "chunkIndex": 3,
      "score": 0.92,
      "excerpt": "Relevant text excerpt..."
    }
  ],
  "sessionId": "session-uuid"
}
```

## Pinecone Index Configuration

Create your Pinecone index with these settings:
- **Dimensions**: 1024 (mistral-embed output size)
- **Metric**: cosine
- **Cloud**: Any (aws/gcp/azure)

## Docker Deployment

```bash
docker build -t rag-assistant .
docker run -p 3000:3000 \
  -e PINECONE_API_KEY=your_key \
  -e MISTRAL_API_KEY=your_key \
  rag-assistant
```

## Railway Deployment

This project includes a `railway.json` for one-click deployment to Railway:

1. Push to GitHub
2. Connect to Railway
3. Set environment variables in Railway dashboard
4. Deploy

## License

MIT
