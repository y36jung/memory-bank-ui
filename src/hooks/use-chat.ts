'use client';

import { skipToken, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  createChatSession,
  deleteChatSession,
  getChatSession,
  listChatSessions,
  renameChatSession,
  streamChatMessage,
} from '@/lib/api/chat';
import type { ChatMessage, ChatSessionDetail, ChatSource } from '@/lib/api/types';

export function useChatSessions(search?: string) {
  return useQuery({
    queryKey: ['chat', 'sessions', { search }],
    queryFn: () => listChatSessions(search),
  });
}

export function useChatSession(sessionId: string | null) {
  return useQuery({
    queryKey: ['chat', 'session', sessionId],
    queryFn: () => getChatSession(sessionId as string),
    enabled: sessionId !== null,
  });
}

export function useCreateChatSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => createChatSession(title),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      queryClient.setQueryData(['chat', 'session', session.id], { ...session, messages: [] });
    },
  });
}

export function useRenameChatSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, title }: { sessionId: string; title: string }) =>
      renameChatSession(sessionId, title),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      queryClient.setQueryData<ChatSessionDetail>(sessionKey(session.id), (prev) =>
        prev ? { ...prev, title: session.title, updatedAt: session.updatedAt } : prev,
      );
    },
  });
}

export function useDeleteChatSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => deleteChatSession(sessionId),
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      queryClient.removeQueries({ queryKey: sessionKey(sessionId) });
      queryClient.removeQueries({ queryKey: streamKey(sessionId) });
    },
  });
}

interface ChatStreamState {
  content: string;
  sources: ChatSource[];
}

function sessionKey(sessionId: string) {
  return ['chat', 'session', sessionId] as const;
}

function streamKey(sessionId: string) {
  return ['chat', 'stream', sessionId] as const;
}

function appendMessage(queryClient: QueryClient, sessionId: string, message: ChatMessage) {
  queryClient.setQueryData<ChatSessionDetail>(sessionKey(sessionId), (prev) =>
    prev ? { ...prev, messages: [...prev.messages, message] } : prev,
  );
}

// Live per-session streaming buffer, backed by the query cache instead of
// component state. A response streaming for session A only ever touches A's
// cache entry, so it can't leak into whatever session happens to be on
// screen, and it survives the user navigating away and back.
export function useChatStream(sessionId: string | null) {
  return useQuery<ChatStreamState>({
    queryKey: streamKey(sessionId ?? '__none__'),
    queryFn: skipToken,
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, message }: { sessionId: string; message: string }) => {
      appendMessage(queryClient, sessionId, {
        id: `optimistic-${Date.now()}`,
        sessionId,
        role: 'user',
        content: message,
        sources: null,
        createdAt: new Date().toISOString(),
      });

      queryClient.setQueryData<ChatStreamState>(streamKey(sessionId), { content: '', sources: [] });

      try {
        await streamChatMessage(sessionId, message, (event) => {
          if (event.type === 'delta') {
            queryClient.setQueryData<ChatStreamState>(streamKey(sessionId), (prev) => ({
              content: (prev?.content ?? '') + event.content,
              sources: prev?.sources ?? [],
            }));
          } else if (event.type === 'done') {
            const buffered = queryClient.getQueryData<ChatStreamState>(streamKey(sessionId));
            if (buffered?.content) {
              appendMessage(queryClient, sessionId, {
                id: event.messageId,
                sessionId,
                role: 'assistant',
                content: buffered.content,
                sources: event.sources.length > 0 ? event.sources : null,
                createdAt: new Date().toISOString(),
              });
            }
            queryClient.removeQueries({ queryKey: streamKey(sessionId) });
          } else if (event.type === 'error') {
            queryClient.removeQueries({ queryKey: streamKey(sessionId) });
          }
        });
      } catch (err) {
        queryClient.removeQueries({ queryKey: streamKey(sessionId) });
        throw err;
      }
    },
  });
}
