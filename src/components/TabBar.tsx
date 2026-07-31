'use client';

import type { Icon } from '@tabler/icons-react';

export interface TabBarItem {
  id: string;
  label: string;
  icon: Icon;
}

export function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: TabBarItem[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      className="flex items-center shrink-0 border-b"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const TabIcon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors"
            style={{
              borderColor: isActive ? 'var(--color-teal)' : 'transparent',
              color: isActive ? 'var(--color-teal)' : 'var(--color-text-mid)',
            }}
          >
            <TabIcon size={14} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
