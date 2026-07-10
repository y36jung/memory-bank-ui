import { apiFetch, apiFetchBlob } from './client';
import type { Document, DocumentUploadResult, PaginatedDocuments } from './types';

export interface ListDocumentsParams {
  search?: string;
  status?: Document['status'] | Document['status'][];
  page?: number;
  limit?: number;
}

export async function listDocuments(params?: ListDocumentsParams): Promise<PaginatedDocuments> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.page != null) query.set('page', String(params.page));
  if (params?.limit != null) query.set('limit', String(params.limit));
  if (params?.status) {
    const statuses = Array.isArray(params.status) ? params.status : [params.status];
    statuses.forEach((s) => query.append('status', s));
  }
  const qs = query.toString();
  return apiFetch<PaginatedDocuments>(`/documents${qs ? `?${qs}` : ''}`);
}

export async function uploadDocument(file: File): Promise<DocumentUploadResult> {
  const body = new FormData();
  body.append('file', file);
  return apiFetch<DocumentUploadResult>('/documents/upload', { method: 'POST', body });
}

export async function getDocumentFile(documentId: string): Promise<Blob> {
  return apiFetchBlob(`/documents/${documentId}/file`);
}
