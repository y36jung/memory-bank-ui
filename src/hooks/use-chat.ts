'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createChatSession, listChatSessions, streamChatMessage } from '@/lib/api/chat';
import type { ChatSource } from '@/lib/api/types';

export function useChatSessions(search?: string) {
  return useQuery({
    queryKey: ['chat', 'sessions', { search }],
    queryFn: () => listChatSessions(search),
  });
}

export function useCreateChatSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => createChatSession(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
    },
  });
}

export function useStreamChatMessage() {
  const [streamedContent, setStreamedContent] = useState('');
  const [sources, setSources] = useState<ChatSource[]>([]);
  const [messageId, setMessageId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({
      sessionId,
      message,
      signal,
    }: {
      sessionId: string;
      message: string;
      signal?: AbortSignal;
    }) => {
      setStreamedContent('');
      setSources([]);
      setMessageId(null);
      return streamChatMessage(
        sessionId,
        message,
        (event) => {
          if (event.type === 'delta') {
            setStreamedContent((prev) => prev + event.content);
          } else if (event.type === 'done') {
            setMessageId(event.messageId);
            setSources(event.sources);
          }
        },
        signal,
      );
    },
  });

  return { ...mutation, streamedContent, sources, messageId };
}
