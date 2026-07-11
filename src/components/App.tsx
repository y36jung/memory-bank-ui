'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LeftRail } from './LeftRail';
import { DocumentLibrary } from './DocumentLibrary';
import { ChatPanel } from './ChatPanel';

const DocumentViewer = dynamic(
  () => import('./DocumentViewer').then((m) => ({ default: m.DocumentViewer })),
  { ssr: false },
);
import { useCreateChatSession, useChatSessions, useDocuments } from '@/hooks';
import type { ChatSession, ChatSource, Document } from '@/lib/api/types';

export function App() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [targetPage, setTargetPage] = useState<number | null>(null);
  const [highlightText, setHighlightText] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const { data: sessions } = useChatSessions();
  const { data: docsData } = useDocuments({ limit: 100 });
  const createSession = useCreateChatSession();

  useEffect(() => {
    if (initialized) return;
    if (sessions === undefined) return;

    if (sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    } else {
      createSession.mutate(undefined, {
        onSuccess: (session) => setActiveSessionId(session.id),
      });
    }
    setInitialized(true);
  }, [sessions, initialized, createSession]);

  const activeSession: ChatSession | null =
    sessions?.find((s) => s.id === activeSessionId) ?? null;

  function handleNewSession() {
    createSession.mutate(undefined, {
      onSuccess: (session) => setActiveSessionId(session.id),
    });
  }

  function handleSelectDoc(doc: Document) {
    setSelectedDoc(doc);
    setTargetPage(null);
    setHighlightText(null);
  }

  function handleCitationClick(source: ChatSource) {
    const doc = docsData?.items.find((d) => d.id === source.documentId);
    if (doc) setSelectedDoc(doc);
    setTargetPage(source.pageNumber ?? null);
    setHighlightText(source.content ?? null);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <LeftRail />
      <DocumentLibrary
        selectedDocId={selectedDoc?.id ?? null}
        onSelectDoc={handleSelectDoc}
      />
      <DocumentViewer
        doc={selectedDoc}
        targetPage={targetPage ?? undefined}
        highlightText={highlightText ?? undefined}
      />
      <ChatPanel
        session={activeSession}
        onNewSession={handleNewSession}
        onSelectSession={setActiveSessionId}
        onCitationClick={handleCitationClick}
      />
    </div>
  );
}
