'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  IconBooks,
  IconSearch,
  IconX,
  IconUpload,
  IconFileTypePdf,
  IconMarkdown,
  IconFile,
} from '@tabler/icons-react';
import { useDocuments, useUploadDocument } from '@/hooks';
import type { Document } from '@/lib/api/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StatusBadge({ status }: { status: Document['status'] }) {
  if (status === 'indexed') {
    return (
      <span
        className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
        style={{ backgroundColor: 'var(--color-teal-light)', color: 'var(--color-teal)' }}
      >
        ready
      </span>
    );
  }
  if (status === 'pending' || status === 'processing') {
    return (
      <span
        className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
        style={{ backgroundColor: 'var(--color-amber-bg)', color: 'var(--color-amber-text)' }}
      >
        indexing
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
      failed
    </span>
  );
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === 'application/pdf') {
    return <IconFileTypePdf size={18} style={{ color: 'var(--color-pdf)', flexShrink: 0 }} />;
  }
  if (mimeType === 'text/markdown' || mimeType === 'text/x-markdown') {
    return <IconMarkdown size={18} style={{ color: 'var(--color-teal)', flexShrink: 0 }} />;
  }
  return <IconFile size={18} style={{ color: 'var(--color-text-light)', flexShrink: 0 }} />;
}

function DocumentItem({
  doc,
  selected,
  onClick,
}: {
  doc: Document;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-start gap-2 px-3 py-2 transition-colors relative"
      style={{
        backgroundColor: selected ? 'var(--color-teal-light)' : 'transparent',
        borderLeft: selected ? '2px solid var(--color-teal)' : '2px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-secondary)';
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
      }}
    >
      <div className="mt-0.5">
        <FileIcon mimeType={doc.mimeType} />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-xs font-medium truncate leading-tight"
          style={{ color: 'var(--color-text)' }}
        >
          {doc.originalName}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px]" style={{ color: 'var(--color-text-light)' }}>
            {formatDate(doc.createdAt)}
          </span>
          <StatusBadge status={doc.status} />
        </div>
      </div>
    </button>
  );
}

function UploadZone({ onUpload }: { onUpload: (file: File) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onUpload(file);
    },
    [onUpload],
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="mx-3 my-2 rounded-lg border border-dashed cursor-pointer flex flex-col items-center gap-1 py-3 transition-colors"
      style={{
        borderColor: dragOver ? 'var(--color-teal)' : 'var(--color-border)',
        backgroundColor: dragOver ? 'var(--color-teal-light)' : 'transparent',
        color: dragOver ? 'var(--color-teal)' : 'var(--color-text-light)',
      }}
    >
      <IconUpload size={14} />
      <span className="text-[11px]">drag & drop or click to upload</span>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.md,.txt"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export function DocumentLibrary({
  selectedDocId,
  onSelectDoc,
}: {
  selectedDocId: string | null;
  onSelectDoc: (doc: Document) => void;
}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useDocuments({ search: debouncedSearch || undefined });
  const queryClient = useQueryClient();

  const hasInProgress = data?.items.some(
    (d) => d.status === 'pending' || d.status === 'processing',
  ) ?? false;

  useEffect(() => {
    if (!hasInProgress) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }, 3000);
    return () => clearInterval(interval);
  }, [hasInProgress, queryClient]);

  const uploadMutation = useUploadDocument();

  const docs = data?.items ?? [];

  return (
    <div
      className="flex flex-col w-[248px] shrink-0 h-full border-r"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-3 border-b text-xs font-semibold"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
      >
        <IconBooks size={14} style={{ color: 'var(--color-text-mid)' }} />
        Library
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs"
          style={{ backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}
        >
          <IconSearch size={12} style={{ color: 'var(--color-text-light)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs placeholder:text-(--color-text-light)"
            style={{ color: 'var(--color-text)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ color: 'var(--color-text-light)' }}>
              <IconX size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Upload zone */}
      <UploadZone
        onUpload={(file) => uploadMutation.mutate(file)}
      />

      {/* Document list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="px-3 py-4 text-[11px] text-center" style={{ color: 'var(--color-text-light)' }}>
            Loading…
          </div>
        )}
        {!isLoading && docs.length === 0 && (
          <div className="px-3 py-4 text-[11px] text-center" style={{ color: 'var(--color-text-light)' }}>
            No documents yet
          </div>
        )}
        {docs.map((doc) => (
          <DocumentItem
            key={doc.id}
            doc={doc}
            selected={doc.id === selectedDocId}
            onClick={() => onSelectDoc(doc)}
          />
        ))}
      </div>

      {uploadMutation.isPending && (
        <div
          className="px-3 py-2 text-[11px] border-t"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-mid)' }}
        >
          Uploading…
        </div>
      )}
      {uploadMutation.isError && (
        <div className="px-3 py-2 text-[11px] border-t border-red-200 text-red-600">
          Upload failed
        </div>
      )}
    </div>
  );
}
