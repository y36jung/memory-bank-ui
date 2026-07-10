import Link from 'next/link';
import { IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react';

export function CardHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="text-center mb-[20px]">
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--color-text-light)', marginTop: 3 }}>{sub}</div>
    </div>
  );
}

export function Field({
  label,
  error,
  labelRight,
  children,
}: {
  label: string;
  error?: string;
  labelRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 5 }}>
        <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-mid)' }}>{label}</label>
        {labelRight}
      </div>
      {children}
      {error && (
        <div style={{ fontSize: 10.5, color: 'var(--color-pdf)', marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
}

export function EyeButton({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label="Toggle password visibility"
      onClick={onToggle}
      className="absolute right-[9px] top-1/2 -translate-y-1/2 flex items-center p-[2px]"
      style={{ border: 'none', background: 'none', color: 'var(--color-text-light)', cursor: 'pointer' }}
    >
      {show ? <IconEyeOff size={14} /> : <IconEye size={14} />}
    </button>
  );
}

export function Checkbox({ checked, error }: { checked: boolean; error: boolean }) {
  return (
    <div
      className="w-[15px] h-[15px] rounded-[4px] flex items-center justify-center shrink-0 mt-px transition-all"
      style={{
        border: `1.5px solid ${error ? 'var(--color-pdf)' : checked ? 'var(--color-teal)' : 'var(--color-muted)'}`,
        background: checked ? 'var(--color-teal)' : '#fff',
      }}
    >
      {checked && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path
            d="M1 3.5L3.5 6L8 1"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

export function CheckRow({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-[7px] mt-[14px] mb-[4px] cursor-pointer select-none" onClick={onToggle}>
      <Checkbox checked={checked} error={false} />
      <span style={{ fontSize: 11, color: 'var(--color-text-mid)', lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

export function SubmitButton({
  busy,
  busyLabel,
  onClick,
  children,
}: {
  busy: boolean;
  busyLabel: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="w-full flex items-center justify-center gap-[7px] rounded-[7px] py-[10px] text-white transition-colors"
      style={{
        backgroundColor: busy ? 'var(--color-muted)' : 'var(--color-teal)',
        fontSize: 12.5,
        fontWeight: 500,
        border: 'none',
        cursor: busy ? 'default' : 'pointer',
        marginTop: 14,
      }}
      onMouseEnter={(e) => {
        if (!busy) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-teal-dark)';
      }}
      onMouseLeave={(e) => {
        if (!busy) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-teal)';
      }}
    >
      {busy ? (
        <>
          <IconLoader2 size={14} className="animate-auth-spin" /> {busyLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function SwitchRow({
  prompt,
  linkLabel,
  href,
}: {
  prompt: string;
  linkLabel: string;
  href: string;
}) {
  return (
    <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--color-text-light)', marginTop: 16 }}>
      {prompt}{' '}
      <Link href={href} style={{ color: 'var(--color-teal)', fontWeight: 500, fontSize: 'inherit' }}>
        {linkLabel}
      </Link>
    </div>
  );
}

export function getInputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    border: `1px solid ${hasError ? 'var(--color-pdf)' : 'var(--color-border)'}`,
    borderRadius: 7,
    padding: '9px 11px',
    fontSize: 12.5,
    fontFamily: 'inherit',
    color: 'var(--color-text)',
    background: 'var(--color-surface)',
    outline: 'none',
    transition: 'border-color .12s',
  };
}

export const linkStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--color-teal)',
  cursor: 'pointer',
  border: 'none',
  background: 'none',
  fontFamily: 'inherit',
  padding: 0,
};
