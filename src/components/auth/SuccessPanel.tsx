'use client';

import { useRouter } from 'next/navigation';
import { IconCircleCheck, IconArrowRight } from '@tabler/icons-react';

export function SuccessPanel({ title, subtitle }: { title: string; subtitle: string }) {
  const router = useRouter();

  return (
    <div className="text-center py-[8px] animate-fade-in-up">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-[14px]"
        style={{ backgroundColor: 'var(--color-teal-light)', color: 'var(--color-teal)' }}
      >
        <IconCircleCheck size={24} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-text-light)', marginBottom: 20 }}>{subtitle}</div>
      <button
        type="button"
        onClick={() => router.replace('/')}
        className="w-full flex items-center justify-center gap-[6px] rounded-[7px] py-[10px] text-white font-medium transition-colors"
        style={{ backgroundColor: 'var(--color-teal)', fontSize: 12.5, border: 'none', cursor: 'pointer' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-teal-dark)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-teal)';
        }}
      >
        Continue to Memory Bank <IconArrowRight size={14} />
      </button>
    </div>
  );
}
