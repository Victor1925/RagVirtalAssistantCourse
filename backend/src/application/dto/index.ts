export interface UploadDocumentDto {
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
}

export interface UploadDocumentResponseDto {
  documentId: string;
  documentName: string;
  chunksCreated: number;
  message: string;
}

export interface AskQuestionDto {
  question: string;
  sessionId?: string;
}

export interface AskQuestionResponseDto {
  answer: string;
  sources: Array<{
    documentName: string;
    chunkIndex: number;
    score: number;
    excerpt: string;
  }>;
  sessionId: string;
}
