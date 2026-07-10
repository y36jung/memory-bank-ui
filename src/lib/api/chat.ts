import { apiFetch, apiStreamUrl } from './client';
import { getAccessToken, refreshAccessToken } from './auth-store';
import type { ChatSession, ChatStreamEvent } from './types';

export async function listChatSessions(search?: string): Promise<ChatSession[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiFetch<ChatSession[]>(`/chat/sessions${query}`);
}

export async function createChatSession(title?: string): Promise<ChatSession> {
  return apiFetch<ChatSession>('/chat/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
}

export async function streamChatMessage(
  sessionId: string,
  message: string,
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const url = apiStreamUrl(`/chat/sessions/${sessionId}/messages`);

  function doStreamFetch() {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message }),
      signal,
    });
  }

  let res = await doStreamFetch();

  if (res.status === 401 && getAccessToken() !== null) {
    const newToken = await refreshAccessToken();
    if (newToken) res = await doStreamFetch();
  }

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;
      try {
        onEvent(JSON.parse(raw) as ChatStreamEvent);
      } catch {
        // malformed SSE line — skip
      }
    }
  }
}
