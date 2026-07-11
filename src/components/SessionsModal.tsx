'use client';

import { useRef, useState } from 'react';
import { IconX, IconSearch, IconMessageCircle, IconPencil, IconTrash } from '@tabler/icons-react';
import {
  useChatSessions,
  useCreateChatSession,
  useRenameChatSession,
  useDeleteChatSession,
} from '@/hooks';
import type { ChatSession } from '@/lib/api/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function SessionsModal({
  activeSessionId,
  onSelect,
  onClose,
  onActiveSessionDeleted,
}: {
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  onActiveSessionDeleted: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const skipBlurRef = useRef(false);

  const { data: sessions } = useChatSessions(search || undefined);
  const createSession = useCreateChatSession();
  const renameSession = useRenameChatSession();
  const deleteSession = useDeleteChatSession();

  function handleNew() {
    createSession.mutate(undefined, {
      onSuccess: (session) => {
        onSelect(session.id);
        onClose();
      },
    });
  }

  function startEditing(session: ChatSession) {
    setEditingId(session.id);
    setEditValue(session.title);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditValue('');
  }

  function commitRename(session: ChatSession) {
    const trimmed = editValue.trim();
    cancelEditing();
    if (trimmed && trimmed !== session.title) {
      renameSession.mutate({ sessionId: session.id, title: trimmed });
    }
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      skipBlurRef.current = true;
      cancelEditing();
    }
  }

  function handleTitleBlur(session: ChatSession) {
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }
    commitRename(session);
  }

  function handleDelete(session: ChatSession) {
    deleteSession.mutate(session.id, {
      onSuccess: () => {
        if (session.id !== activeSessionId) return;
        const remaining = (sessions ?? []).filter((s) => s.id !== session.id);
        if (remaining.length > 0) {
          onActiveSessionDeleted(remaining[0].id);
        } else {
          createSession.mutate(undefined, {
            onSuccess: (created) => onActiveSessionDeleted(created.id),
          });
        }
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
          const isEditing = editingId === session.id;
          return (
            <div
              key={session.id}
              role="button"
              tabIndex={isEditing ? -1 : 0}
              onClick={() => {
                if (isEditing) return;
                onSelect(session.id);
                onClose();
              }}
              onKeyDown={(e) => {
                if (isEditing) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(session.id);
                  onClose();
                }
              }}
              className="group w-full flex items-start justify-between gap-2 px-4 py-2.5 transition-colors relative"
              style={{
                backgroundColor: isActive ? 'var(--color-teal-light)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--color-teal)' : '2px solid transparent',
                cursor: isEditing ? 'default' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-secondary)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              {isEditing ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={handleTitleKeyDown}
                  onBlur={() => handleTitleBlur(session)}
                  maxLength={200}
                  className="flex-1 min-w-0 bg-transparent outline-none text-xs font-medium border-b"
                  style={{ color: 'var(--color-text)', borderColor: 'var(--color-teal)' }}
                />
              ) : (
                <span className="text-xs font-medium truncate flex-1 min-w-0" style={{ color: 'var(--color-text)' }}>
                  {session.title || 'Untitled'}
                </span>
              )}

              {!isEditing && (
                <span className="text-[10px] shrink-0 mt-0.5" style={{ color: 'var(--color-text-light)' }}>
                  {formatDate(session.createdAt)}
                </span>
              )}

              {!isEditing && (
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    title="Rename"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(session);
                    }}
                    className="flex items-center justify-center w-6 h-6 rounded transition-colors hover:bg-secondary"
                    style={{ color: 'var(--color-text-light)' }}
                  >
                    <IconPencil size={13} />
                  </button>
                  <button
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(session);
                    }}
                    className="flex items-center justify-center w-6 h-6 rounded transition-colors hover:bg-secondary"
                    style={{ color: 'var(--color-text-light)' }}
                  >
                    <IconTrash size={13} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(renameSession.isError || deleteSession.isError) && (
        <div className="px-4 py-2 text-[11px] border-t border-red-200 text-red-600">
          {renameSession.isError ? 'Failed to rename chat' : 'Failed to delete chat'}
        </div>
      )}
    </div>
  );
}
