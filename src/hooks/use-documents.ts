'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listDocuments, uploadDocument, type ListDocumentsParams } from '@/lib/api/documents';

export function useDocuments(params?: ListDocumentsParams) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => listDocuments(params),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadDocument(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
