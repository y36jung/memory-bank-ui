'use client';

import {
  IconDatabase,
  IconX,
  IconUpload,
  IconLock,
  IconArrowUp,
  IconHistory,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useIsDemoAccount } from '@/hooks';
import { BETA_MODE } from '@/lib/beta';

function GuideRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-[9px]">
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-text-mid)' }}
      >
        {icon}
      </div>
      <p className="text-[12.5px] leading-snug pt-1" style={{ color: 'var(--color-text-mid)' }}>
        {children}
      </p>
    </div>
  );
}

export function WelcomeModal({ onClose }: { onClose: () => void }) {
  const isDemoAccount = useIsDemoAccount();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-modal-backdrop-in"
      style={{ backgroundColor: 'rgba(26, 25, 21, 0.42)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[360px] rounded-[14px] border px-[22px] pt-[22px] pb-5 relative animate-modal-pop-in"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: '0 12px 40px rgba(20,20,15,.16)',
        }}
      >
        <button
          onClick={onClose}
          title="Close"
          className="absolute top-[14px] right-[14px] w-[26px] h-[26px] rounded-[6px] flex items-center justify-center transition-colors hover:bg-secondary"
          style={{ color: 'var(--color-text-light)' }}
        >
          <IconX size={15} />
        </button>

        <div className="flex items-center gap-3 mb-[18px]">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--color-teal-light)', color: 'var(--color-teal)' }}
          >
            <IconDatabase size={20} />
          </div>
          <div>
            <div className="flex items-center gap-[7px]">
              <div className="text-[14.5px] font-semibold" style={{ color: 'var(--color-text)' }}>
                Welcome to Memory Bank
              </div>
              {BETA_MODE && (
                <span
                  className="text-[9.5px] font-semibold uppercase tracking-[0.04em] px-[7px] py-[2px] rounded-full"
                  style={{ backgroundColor: 'var(--color-teal-light)', color: 'var(--color-teal)' }}
                >
                  Beta
                </span>
              )}
            </div>
            <div className="text-[11.5px] mt-px" style={{ color: 'var(--color-text-light)' }}>
              Here&apos;s how to get started
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-5">
          {isDemoAccount ? (
            <GuideRow icon={<IconLock size={14} />}>
              Uploads are disabled on the shared demo account — explore the pre-loaded documents
              instead.
            </GuideRow>
          ) : (
            <GuideRow icon={<IconUpload size={14} />}>
              Upload PDFs, Markdown, HTML, or text files to build your library.
            </GuideRow>
          )}
          <GuideRow icon={<IconArrowUp size={14} />}>
            Ask questions in chat — answers cite the exact documents they come from.
          </GuideRow>
          <GuideRow icon={<IconHistory size={14} />}>
            Revisit past conversations anytime from your chat history.
          </GuideRow>
          <GuideRow icon={<IconInfoCircle size={14} />}>
            This is just a personal project built for learning purposes.
          </GuideRow>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-lg px-3 py-[9px] text-[12.5px] font-medium flex items-center justify-center gap-[7px] transition-colors duration-150 cursor-pointer"
          style={{ backgroundColor: 'var(--color-teal)', color: '#fff' }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
