export type DocumentStatus = 'pending' | 'processing' | 'indexed' | 'failed';
export type DocumentSourceType = 'upload' | 'gmail' | 'gdrive' | 'outlook' | 'onedrive';

export interface Document {
  id: string;
  filename: string;
  originalName: string;
  sourceType: DocumentSourceType;
  mimeType: string;
  storageKey: string | null;
  status: DocumentStatus;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  sizeBytes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedDocuments {
  items: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DocumentUploadResult {
  documentId: string;
  status: 'pending';
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSource {
  chunkId?: string;
  documentId: string;
  documentName: string;
  score?: number;
  pageNumber?: number | null;
}

export type ChatStreamEvent =
  | { type: 'delta'; content: string }
  | { type: 'done'; messageId: string; sources: ChatSource[] }
  | { type: 'error'; message: string };

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}
