import { IconDatabase } from '@tabler/icons-react';

export function AuthShell({
  showFooter = true,
  children,
}: {
  showFooter?: boolean;
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
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>Memory Bank</div>
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

      {showFooter && (
        <div style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--color-text-light)', marginTop: 18 }}>
          By continuing you agree to our{' '}
          <a href="#" style={{ color: 'var(--color-text-mid)', textDecoration: 'none' }}>
            Terms
          </a>{' '}
          and{' '}
          <a href="#" style={{ color: 'var(--color-text-mid)', textDecoration: 'none' }}>
            Privacy Policy
          </a>
        </div>
      )}
    </div>
  );
}
