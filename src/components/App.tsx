'use client';

import { useEffect, useState } from 'react';
import { LeftRail } from './LeftRail';
import { MainPanels } from './MainPanels';
import { DemoBanner } from './DemoBanner';
import { useCreateChatSession, useChatSessions, useDocuments } from '@/hooks';
import type { ChatSession, Document } from '@/lib/api/types';

export function App() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [targetPage, setTargetPage] = useState<number | null>(null);
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
  }

  function handleCitationClick(documentId: string, pageNumber: number | null) {
    const doc = docsData?.items.find((d) => d.id === documentId);
    if (doc) setSelectedDoc(doc);
    setTargetPage(pageNumber);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <DemoBanner />
      <div className="flex flex-1 overflow-hidden">
        <LeftRail />
        <MainPanels
          selectedDoc={selectedDoc}
          targetPage={targetPage}
          onSelectDoc={handleSelectDoc}
          session={activeSession}
          onNewSession={handleNewSession}
          onSelectSession={setActiveSessionId}
          onCitationClick={handleCitationClick}
        />
      </div>
    </div>
  );
}
