'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { IconHistory, IconPlus, IconArrowUp, IconSend } from '@tabler/icons-react';
import { useChatSession, useChatStream, useSendChatMessage } from '@/hooks';
import { SessionsModal } from './SessionsModal';
import type { ChatSource, ChatSession } from '@/lib/api/types';

interface Message {
  role: 'user' | 'ai';
  content: string;
  sources?: ChatSource[];
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-1.5 h-1.5 rounded-full animate-thinking-dot"
          style={{
            backgroundColor: 'var(--color-text-light)',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function HistoryLoadingState() {
  return (
    <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-text-light)' }}>
      <ThinkingDots />
    </div>
  );
}

function HistoryErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-2 text-center"
      style={{ color: 'var(--color-text-light)' }}
    >
      <span className="text-xs">Couldn&apos;t load this conversation.</span>
      <button onClick={onRetry} className="text-xs font-medium underline" style={{ color: 'var(--color-teal)' }}>
        Try again
      </button>
    </div>
  );
}

function SourceFooter({
  sources,
  onCitationClick,
}: {
  sources: ChatSource[];
  onCitationClick?: (documentId: string, pageNumber: number | null) => void;
}) {
  if (sources.length === 0) return null;
  return (
    <div
      className="mt-1.5 pt-1.5 border-t text-[11px]"
      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-light)' }}
    >
      {sources.map((src, i) => (
        <button
          key={i}
          className="flex items-center gap-1 py-0.5 w-full text-left hover:opacity-75 transition-opacity truncate"
          onClick={() => onCitationClick?.(src.documentId, src.pageNumber ?? null)}
          style={{ color: 'var(--color-text-light)' }}
        >
          <span className="truncate">{src.documentName}</span>
          {src.pageNumber != null && (
            <span className="shrink-0 font-semibold" style={{ color: 'var(--color-teal)' }}>
              § p.{src.pageNumber}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end animate-fade-in-up">
      <div
        className="max-w-[88%] px-3 py-2 text-xs text-white"
        style={{ backgroundColor: 'var(--color-teal)', borderRadius: '12px 12px 3px 12px' }}
      >
        {content}
      </div>
    </div>
  );
}

function AiBubble({
  content,
  sources,
  onCitationClick,
}: {
  content: string;
  sources?: ChatSource[];
  onCitationClick?: (documentId: string, pageNumber: number | null) => void;
}) {
  return (
    <div className="flex justify-start animate-fade-in-up">
      <div
        className="max-w-[95%] px-3 py-2 text-xs"
        style={{
          backgroundColor: 'var(--color-secondary)',
          borderRadius: '3px 12px 12px 12px',
          color: 'var(--color-text)',
        }}
      >
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{content}</div>
        {sources && <SourceFooter sources={sources} onCitationClick={onCitationClick} />}
      </div>
    </div>
  );
}

export function ChatPanel({
  session,
  onNewSession,
  onSelectSession,
  onCitationClick,
}: {
  session: ChatSession | null;
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
  onCitationClick?: (documentId: string, pageNumber: number | null) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionIdRef = useRef<string | null>(null);

  const { mutate: sendMessage } = useSendChatMessage();

  const activeSessionId = session?.id ?? null;
  const {
    data: sessionDetail,
    isFetching: isSessionFetching,
    isError: isSessionError,
    refetch: refetchSessionDetail,
  } = useChatSession(activeSessionId);

  // Streaming state for whichever session is on screen. Keyed by session id
  // in the query cache, so a response streaming for a different session
  // never shows up here, and switching back mid-stream (or after it
  // finishes) picks the right state back up.
  const { data: activeStream } = useChatStream(activeSessionId);
  const isStreamingActive = activeStream !== undefined;
  const isThinking = isStreamingActive && activeStream.content === '';
  const streamedContent = activeStream?.content ?? '';

  // Reset local state when switching sessions
  useEffect(() => {
    if (session?.id !== sessionIdRef.current) {
      sessionIdRef.current = session?.id ?? null;
      setMessages([]);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  }, [session?.id]);

  // Sync messages from fetched history whenever it changes for the active
  // session. Never let it shrink what's already shown: a background refetch
  // can resolve with a pre-send snapshot after an optimistic send already
  // appended locally, and that snapshot must not clobber it.
  useEffect(() => {
    if (!sessionDetail || sessionDetail.id !== activeSessionId) return;
    setMessages((prev) => {
      if (sessionDetail.messages.length < prev.length) return prev;
      return sessionDetail.messages.map((m) => ({
        role: m.role === 'assistant' ? 'ai' : 'user',
        content: m.content,
        sources: m.sources && m.sources.length > 0 ? m.sources : undefined,
      }));
    });
  }, [sessionDetail, activeSessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedContent, isThinking]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !session || isStreamingActive) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    sendMessage({ sessionId: session.id, message: text });
  }, [input, session, isStreamingActive, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 90)}px`;
  };

  const isInitialHistoryLoad = !!session && isSessionFetching && !sessionDetail;
  const isInputDisabled = isStreamingActive || !session || isInitialHistoryLoad;

  return (
    <div className="w-[340px] shrink-0 flex flex-col h-full relative" style={{ backgroundColor: 'var(--color-surface)' }}>
      {showHistory && (
        <SessionsModal
          activeSessionId={session?.id ?? null}
          onSelect={(id) => { onSelectSession(id); setShowHistory(false); }}
          onClose={() => setShowHistory(false)}
          onActiveSessionDeleted={onSelectSession}
        />
      )}

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
          {session?.title || 'New Chat'}
        </span>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button
            title="Chat history"
            onClick={() => setShowHistory(true)}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-secondary"
            style={{ color: 'var(--color-text-light)' }}
          >
            <IconHistory size={15} />
          </button>
          <button
            title="New chat"
            onClick={onNewSession}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-secondary"
            style={{ color: 'var(--color-text-light)' }}
          >
            <IconPlus size={15} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {isSessionError ? (
          <HistoryErrorState onRetry={() => refetchSessionDetail()} />
        ) : isInitialHistoryLoad ? (
          <HistoryLoadingState />
        ) : (
          <>
            {messages.length === 0 && !isStreamingActive && (
              <div
                className="flex flex-col items-center justify-center h-full gap-2"
                style={{ color: 'var(--color-text-light)' }}
              >
                <IconArrowUp size={28} />
                <span className="text-xs">Ask about your documents</span>
              </div>
            )}

            {messages.map((msg, i) =>
              msg.role === 'user' ? (
                <UserBubble key={i} content={msg.content} />
              ) : (
                <AiBubble key={i} content={msg.content} sources={msg.sources} onCitationClick={onCitationClick} />
              ),
            )}

            {isStreamingActive && (
              <>
                {isThinking && <ThinkingDots />}
                {streamedContent && <AiBubble content={streamedContent} />}
              </>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input footer */}
      <div
        className="px-4 py-3 border-t shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div
          className="flex items-end gap-2 px-3 py-2 rounded-lg border"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={
              !session
                ? 'Create a session to start chatting'
                : isInitialHistoryLoad
                  ? 'Loading conversation…'
                  : 'Ask about your documents…'
            }
            disabled={isInputDisabled}
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-xs placeholder:text-(--color-text-light) disabled:opacity-50"
            style={{ color: 'var(--color-text)', minHeight: '22px', maxHeight: '90px' }}
          />
          <button
            onClick={handleSend}
            disabled={isInputDisabled || !input.trim()}
            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors disabled:cursor-not-allowed"
            style={{
              backgroundColor:
                isInputDisabled || !input.trim() ? 'var(--color-muted)' : 'var(--color-teal)',
              color: 'white',
            }}
            onMouseEnter={(e) => {
              if (!isInputDisabled && input.trim())
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-teal-dark)';
            }}
            onMouseLeave={(e) => {
              if (!isInputDisabled && input.trim())
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-teal)';
            }}
          >
            <IconSend size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
