import { IconDatabase } from '@tabler/icons-react';
import { BETA_MODE } from '@/lib/beta';

export function AuthShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="flex flex-col items-center mb-[22px]">
        <div
          className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center mb-[10px]"
          style={{ backgroundColor: 'var(--color-teal)' }}
        >
          <IconDatabase size={18} color="#fff" />
        </div>
        <div className="flex items-center gap-[7px]">
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>Memory Bank</div>
          {BETA_MODE && (
            <span
              className="text-[9.5px] font-semibold uppercase tracking-[0.04em] px-[7px] py-[2px] rounded-full"
              style={{ backgroundColor: 'var(--color-teal-light)', color: 'var(--color-teal)' }}
            >
              Beta
            </span>
          )}
        </div>
      </div>

      <div
        className="w-full max-w-[376px] rounded-xl px-[26px] py-[28px] animate-fade-in-up"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 1px 2px rgba(0,0,0,.03)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
