'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { IconBooks, IconFileDescription, IconMessage2 } from '@tabler/icons-react';
import { DocumentLibrary } from './DocumentLibrary';
import { ChatPanel } from './ChatPanel';
import { TabBar } from './TabBar';
import { useViewportTier } from '@/hooks';
import type { ChatSession, Document } from '@/lib/api/types';

const DocumentViewer = dynamic(
  () => import('./DocumentViewer').then((m) => ({ default: m.DocumentViewer })),
  { ssr: false },
);

const SEPARATOR_CLASSNAME = 'w-1 cursor-col-resize transition-colors hover:bg-[var(--color-teal-accent)] active:bg-[var(--color-teal)]';

function VisibilityPane({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return <div className={visible ? 'h-full w-full' : 'hidden'}>{children}</div>;
}

export function MainPanels({
  selectedDoc,
  targetPage,
  onSelectDoc,
  session,
  onNewSession,
  onSelectSession,
  onCitationClick,
}: {
  selectedDoc: Document | null;
  targetPage?: number | null;
  onSelectDoc: (doc: Document) => void;
  session: ChatSession | null;
  onNewSession: () => void;
  onSelectSession: (id: string | null) => void;
  onCitationClick: (documentId: string, pageNumber: number | null) => void;
}) {
  const tier = useViewportTier();
  const [contentTab, setContentTab] = useState<'preview' | 'chat'>('chat');
  const [mobileSection, setMobileSection] = useState<'library' | 'content'>('library');

  useEffect(() => {
    if (selectedDoc) {
      setContentTab('preview');
      setMobileSection('content');
    }
  }, [selectedDoc, targetPage]);

  const library = <DocumentLibrary selectedDocId={selectedDoc?.id ?? null} onSelectDoc={onSelectDoc} />;
  const preview = <DocumentViewer doc={selectedDoc} targetPage={targetPage ?? undefined} />;
  const chat = (
    <ChatPanel
      session={session}
      onNewSession={onNewSession}
      onSelectSession={onSelectSession}
      onCitationClick={onCitationClick}
    />
  );

  if (tier === 'wide') {
    return (
      <Group orientation="horizontal" className="flex-1 h-full overflow-hidden">
        <Panel defaultSize="19" minSize="14" maxSize="32" className="h-full">
          {library}
        </Panel>
        <Separator className={SEPARATOR_CLASSNAME} />
        <Panel defaultSize="56" minSize="32" className="h-full">
          {preview}
        </Panel>
        <Separator className={SEPARATOR_CLASSNAME} />
        <Panel defaultSize="25" minSize="18" maxSize="42" className="h-full">
          {chat}
        </Panel>
      </Group>
    );
  }

  if (tier === 'medium') {
    return (
      <Group orientation="horizontal" className="flex-1 h-full overflow-hidden">
        <Panel defaultSize="32" minSize="22" maxSize="50" className="h-full">
          {library}
        </Panel>
        <Separator className={SEPARATOR_CLASSNAME} />
        <Panel minSize="50" className="h-full flex flex-col">
          <TabBar
            tabs={[
              { id: 'preview', label: 'Preview', icon: IconFileDescription },
              { id: 'chat', label: 'Chat', icon: IconMessage2 },
            ]}
            active={contentTab}
            onChange={(id) => setContentTab(id as 'preview' | 'chat')}
          />
          <div className="flex-1 min-h-0 overflow-hidden">
            <VisibilityPane visible={contentTab === 'preview'}>{preview}</VisibilityPane>
            <VisibilityPane visible={contentTab === 'chat'}>{chat}</VisibilityPane>
          </div>
        </Panel>
      </Group>
    );
  }

  const narrowActive = mobileSection === 'library' ? 'library' : contentTab;

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      <TabBar
        tabs={[
          { id: 'library', label: 'Library', icon: IconBooks },
          { id: 'preview', label: 'Preview', icon: IconFileDescription },
          { id: 'chat', label: 'Chat', icon: IconMessage2 },
        ]}
        active={narrowActive}
        onChange={(id) => {
          if (id === 'library') {
            setMobileSection('library');
          } else {
            setMobileSection('content');
            setContentTab(id as 'preview' | 'chat');
          }
        }}
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        <VisibilityPane visible={mobileSection === 'library'}>{library}</VisibilityPane>
        <VisibilityPane visible={mobileSection === 'content' && contentTab === 'preview'}>{preview}</VisibilityPane>
        <VisibilityPane visible={mobileSection === 'content' && contentTab === 'chat'}>{chat}</VisibilityPane>
      </div>
    </div>
  );
}
