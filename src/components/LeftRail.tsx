'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { IconDatabase, IconBooks, IconUserCircle, IconHelpCircle } from '@tabler/icons-react';
import { AccountModal } from './AccountModal';
import { WelcomeModal } from './WelcomeModal';
import {
  checkWelcomeGuideSeen,
  getWelcomeGuideSeenSnapshot,
  markWelcomeGuideSeen,
  subscribeWelcomeGuideSeen,
} from '@/lib/welcome-guide';

export function LeftRail() {
  const [accountOpen, setAccountOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const hasSeenGuide = useSyncExternalStore(
    subscribeWelcomeGuideSeen,
    getWelcomeGuideSeenSnapshot,
    getWelcomeGuideSeenSnapshot,
  );

  useEffect(() => {
    checkWelcomeGuideSeen();
  }, []);

  function closeGuide() {
    markWelcomeGuideSeen();
    setGuideOpen(false);
  }

  return (
    <div className="flex flex-col items-center w-14 shrink-0 bg-surface border-r border-border py-3 gap-1">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg mb-2" style={{ backgroundColor: 'var(--color-teal)' }}>
        <IconDatabase size={18} color="white" />
      </div>

      <div className="flex flex-col items-center gap-1 w-full px-2 mt-1">
        <button
          title="Library"
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--color-teal-light)', color: 'var(--color-teal)' }}
        >
          <IconBooks size={18} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-1 w-full px-2 mt-auto">
        <button
          title="Guide"
          onClick={() => setGuideOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-secondary"
          style={
            guideOpen || !hasSeenGuide
              ? { backgroundColor: 'var(--color-teal-light)', color: 'var(--color-teal)' }
              : { color: 'var(--color-text-light)' }
          }
        >
          <IconHelpCircle size={18} />
        </button>
        <button
          title="Account"
          onClick={() => setAccountOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-secondary"
          style={
            accountOpen
              ? { backgroundColor: 'var(--color-teal-light)', color: 'var(--color-teal)' }
              : { color: 'var(--color-text-light)' }
          }
        >
          <IconUserCircle size={18} />
        </button>
      </div>

      {accountOpen && <AccountModal onClose={() => setAccountOpen(false)} />}
      {(guideOpen || !hasSeenGuide) && <WelcomeModal onClose={closeGuide} />}
    </div>
  );
}
