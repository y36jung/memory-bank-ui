'use client';

import { useState } from 'react';
import { IconInfoCircle, IconX } from '@tabler/icons-react';
import { useIsDemoAccount } from '@/hooks';

export function DemoBanner() {
  const isDemoAccount = useIsDemoAccount();
  const [dismissed, setDismissed] = useState(false);

  if (!isDemoAccount || dismissed) return null;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 text-[11.5px] shrink-0"
      style={{
        backgroundColor: 'var(--color-amber-bg)',
        color: 'var(--color-pdf)',
        borderBottom: '1px solid var(--color-pdf-border)',
      }}
    >
      <IconInfoCircle size={14} className="shrink-0" />
      <span className="flex-1">
        You&apos;re using the shared public demo account — chats and documents here are visible to
        other visitors and may be cleared at any time.
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{ color: 'inherit', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <IconX size={14} />
      </button>
    </div>
  );
}
