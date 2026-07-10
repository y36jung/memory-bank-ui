'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Papa from 'papaparse';
import {
  IconFileDescription,
  IconFileTypePdf,
  IconMarkdown,
  IconFile,
} from '@tabler/icons-react';
import type { Document as Doc } from '@/lib/api/types';
import { getDocumentFile } from '@/lib/api/documents';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatSize(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mimeLabel(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'text/markdown' || mimeType === 'text/x-markdown') return 'md';
  if (mimeType === 'text/csv') return 'csv';
  return mimeType.split('/')[1] ?? mimeType;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === 'application/pdf')
    return <IconFileTypePdf size={16} style={{ color: 'var(--color-pdf)', flexShrink: 0 }} />;
  if (mimeType === 'text/markdown' || mimeType === 'text/x-markdown')
    return <IconMarkdown size={16} style={{ color: 'var(--color-teal)', flexShrink: 0 }} />;
  return <IconFile size={16} style={{ color: 'var(--color-text-light)', flexShrink: 0 }} />;
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[11px]"
      style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-text-mid)' }}
    >
      {children}
    </span>
  );
}

function StatusChip({ status }: { status: Doc['status'] }) {
  if (status === 'indexed') {
    return (
      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
        style={{ backgroundColor: 'var(--color-teal-light)', color: 'var(--color-teal)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        indexed
      </span>
    );
  }
  if (status === 'pending' || status === 'processing') {
    return (
      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
        style={{ backgroundColor: 'var(--color-amber-bg)', color: 'var(--color-amber-text)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        processing
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      failed
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 flex flex-col gap-3 animate-pulse">
      {[100, 80, 90, 60, 85].map((w, i) => (
        <div
          key={i}
          className="h-3 rounded"
          style={{ width: `${w}%`, backgroundColor: 'var(--color-secondary)' }}
        />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-6 text-center">
      <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>
        Failed to load document
      </p>
      <p className="text-[11px] mt-1 opacity-70" style={{ color: 'var(--color-text-light)' }}>
        {message}
      </p>
    </div>
  );
}

function PdfViewer({ documentId, targetPage }: { documentId: string; targetPage?: number }) {
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setNumPages(0);
    setLoading(true);
    setError(null);
    setBlobUrl(null);
    pageRefs.current = [];
    getDocumentFile(documentId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch((e: Error) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (targetPage == null) return;
    const el = pageRefs.current[targetPage - 1];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [targetPage]);

  return (
    <div ref={containerRef} className="w-full">
      {loading && <LoadingSkeleton />}
      {error && <ErrorState message={error} />}
      {blobUrl && (
        <Document
          file={blobUrl}
          onLoadSuccess={({ numPages: n }) => { setNumPages(n); setLoading(false); }}
          onLoadError={(e) => { setError(e.message); setLoading(false); }}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div key={i} ref={(el) => { pageRefs.current[i] = el; }}>
              <div
                className="text-center text-[11px] py-1.5"
                style={{ color: 'var(--color-text-light)' }}
              >
                Page {i + 1} of {numPages}
              </div>
              <Page
                pageNumber={i + 1}
                width={containerWidth || undefined}
              />
            </div>
          ))}
        </Document>
      )}
    </div>
  );
}

function MarkdownViewer({ documentId }: { documentId: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setContent(null);
    setLoading(true);
    setError(null);
    getDocumentFile(documentId)
      .then((blob) => blob.text())
      .then((text) => { if (!cancelled) setContent(text); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [documentId]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="px-8 py-6 mx-auto w-full" style={{ maxWidth: '720px' }}>
      <div
        className="prose prose-sm"
        style={{ color: 'var(--color-text)' }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-xl font-bold mb-3 mt-6" style={{ color: 'var(--color-text)' }}>{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold mb-2 mt-5" style={{ color: 'var(--color-text)' }}>{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-3 text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>{children}</p>
            ),
            code: ({ children, className }) => {
              const isBlock = className?.startsWith('language-');
              return isBlock ? (
                <code
                  className="block p-3 rounded text-xs overflow-x-auto mb-3"
                  style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-text)' }}
                >
                  {children}
                </code>
              ) : (
                <code
                  className="px-1 py-0.5 rounded text-xs"
                  style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-teal)' }}
                >
                  {children}
                </code>
              );
            },
            blockquote: ({ children }) => (
              <blockquote
                className="border-l-4 pl-3 my-3 text-sm italic"
                style={{ borderColor: 'var(--color-teal)', color: 'var(--color-text-mid)' }}
              >
                {children}
              </blockquote>
            ),
            ul: ({ children }) => <ul className="list-disc pl-5 mb-3 text-sm space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 text-sm space-y-1">{children}</ol>,
            li: ({ children }) => <li style={{ color: 'var(--color-text)' }}>{children}</li>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-teal)' }} className="underline">
                {children}
              </a>
            ),
          }}
        >
          {content ?? ''}
        </ReactMarkdown>
      </div>
    </div>
  );
}

function CsvViewer({ documentId }: { documentId: string }) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHeaders([]);
    setRows([]);
    setLoading(true);
    setError(null);
    getDocumentFile(documentId)
      .then((blob) => blob.text())
      .then((text) => {
        if (cancelled) return;
        const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
        if (result.data.length > 0) {
          setHeaders(result.data[0]);
          setRows(result.data.slice(1));
        }
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [documentId]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-semibold whitespace-nowrap border-b sticky top-0"
                style={{
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-secondary)',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              style={{ borderBottomColor: 'var(--color-border)' }}
              className="border-b hover:bg-(--color-secondary) transition-colors"
            >
              {headers.map((_, ci) => (
                <td
                  key={ci}
                  className="px-3 py-1.5 whitespace-nowrap"
                  style={{ color: 'var(--color-text-mid)' }}
                >
                  {row[ci] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="text-center text-xs py-6" style={{ color: 'var(--color-text-light)' }}>
          No data rows
        </p>
      )}
    </div>
  );
}

function UnsupportedViewer({ mimeType }: { mimeType: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 py-16">
      <IconFile size={32} style={{ color: 'var(--color-text-light)' }} />
      <span className="text-xs" style={{ color: 'var(--color-text-light)' }}>
        Preview not available for {mimeType}
      </span>
    </div>
  );
}

export function DocumentViewer({ doc, targetPage }: { doc: Doc | null; targetPage?: number }) {
  if (!doc) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-2 h-full"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <IconFileDescription size={44} style={{ color: 'var(--color-text-light)' }} />
        <span className="text-xs" style={{ color: 'var(--color-text-light)' }}>
          Select a document to preview
        </span>
      </div>
    );
  }

  const isPdf = doc.mimeType === 'application/pdf';
  const isMarkdown = doc.mimeType === 'text/markdown' || doc.mimeType === 'text/x-markdown';
  const isCsv = doc.mimeType === 'text/csv';

  return (
    <div
      className="flex-1 flex flex-col h-full border-r overflow-hidden"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      {/* Sticky header */}
      <div
        className="px-4 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileIcon mimeType={doc.mimeType} />
            <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
              {doc.originalName}
            </span>
          </div>
          {/* "In context" toggle — non-functional placeholder */}
          <button
            className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-medium transition-colors"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-mid)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--color-text-light)' }}
            />
            in context
          </button>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          <MetaChip>{mimeLabel(doc.mimeType)}</MetaChip>
          <MetaChip>{formatSize(doc.sizeBytes)}</MetaChip>
          <MetaChip>{formatDate(doc.createdAt)}</MetaChip>
          <StatusChip status={doc.status} />
        </div>
      </div>

      {/* Scrollable body */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {isPdf && <PdfViewer documentId={doc.id} targetPage={targetPage} />}
        {isMarkdown && <MarkdownViewer documentId={doc.id} />}
        {isCsv && <CsvViewer documentId={doc.id} />}
        {!isPdf && !isMarkdown && !isCsv && <UnsupportedViewer mimeType={doc.mimeType} />}
      </div>
    </div>
  );
}
