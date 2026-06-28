'use client';

import { useState } from 'react';
import { IconX, IconSearch, IconMessageCircle } from '@tabler/icons-react';
import { useChatSessions, useCreateChatSession } from '@/hooks';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function SessionsModal({
  activeSessionId,
  onSelect,
  onClose,
}: {
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const { data: sessions } = useChatSessions(search || undefined);
  const createSession = useCreateChatSession();

  function handleNew() {
    createSession.mutate(undefined, {
      onSuccess: (session) => {
        onSelect(session.id);
        onClose();
      },
    });
  }

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
          Chat History
        </span>
        <button
          onClick={onClose}
          title="Close history"
          className="flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-secondary"
          style={{ color: 'var(--color-text-light)' }}
        >
          <IconX size={15} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md"
          style={{ backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}
        >
          <IconSearch size={12} style={{ color: 'var(--color-text-light)' }} />
          <input
            type="text"
            placeholder="Search sessions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs placeholder:text-(--color-text-light)"
            style={{ color: 'var(--color-text)' }}
          />
        </div>
      </div>

      {/* New chat button */}
      <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={handleNew}
          disabled={createSession.isPending}
          className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-xs font-medium hover:bg-secondary"
          style={{ color: 'var(--color-teal)' }}
        >
          <IconMessageCircle size={14} />
          New chat
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {(sessions ?? []).length === 0 && (
          <div className="px-4 py-6 text-center text-[11px]" style={{ color: 'var(--color-text-light)' }}>
            No sessions found
          </div>
        )}
        {(sessions ?? []).map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <button
              key={session.id}
              onClick={() => { onSelect(session.id); onClose(); }}
              className="w-full text-left flex items-start justify-between px-4 py-2.5 transition-colors relative"
              style={{
                backgroundColor: isActive ? 'var(--color-teal-light)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--color-teal)' : '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-secondary)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              <span className="text-xs font-medium truncate" style={{ color: 'var(--color-text)' }}>
                {session.title || 'Untitled'}
              </span>
              <span className="text-[10px] shrink-0 ml-2 mt-0.5" style={{ color: 'var(--color-text-light)' }}>
                {formatDate(session.createdAt)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
