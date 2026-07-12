'use client';

import { useState } from 'react';
import {
  IconMail,
  IconLogout2,
  IconTrash,
  IconAlertTriangle,
  IconLoader2,
  IconX,
} from '@tabler/icons-react';
import { useAuthState } from '@/components/auth/AuthProvider';
import { useLogout, useDeleteAccount } from '@/hooks';
import { ApiError } from '@/lib/api/client';

type View = 'profile' | 'confirm';

function initials(email: string) {
  return email.trim().charAt(0).toUpperCase() || '?';
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function ProfileView({
  email,
  logoutPending,
  onLogout,
  onDeleteRequest,
}: {
  email: string;
  logoutPending: boolean;
  onLogout: () => void;
  onDeleteRequest: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3 mb-[18px]">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-semibold"
          style={{ backgroundColor: 'var(--color-teal-light)', color: 'var(--color-teal)' }}
        >
          {initials(email)}
        </div>
        <div>
          <div className="text-[14.5px] font-semibold" style={{ color: 'var(--color-text)' }}>
            Account
          </div>
          <div className="text-[11.5px] mt-px" style={{ color: 'var(--color-text-light)' }}>
            Manage your Memory Bank profile
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div
          className="text-[10.5px] font-semibold tracking-[0.05em] uppercase mb-[7px]"
          style={{ color: 'var(--color-text-light)' }}
        >
          Email
        </div>
        <div
          className="flex items-center gap-[9px] border rounded-lg px-[11px] py-[9px]"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-secondary)' }}
        >
          <IconMail size={15} style={{ color: 'var(--color-text-light)', flexShrink: 0 }} />
          <span
            className="text-[12.5px] overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ color: 'var(--color-text)' }}
          >
            {email}
          </span>
        </div>
      </div>

      <div className="border-t my-1 mb-4" style={{ borderColor: 'var(--color-border)' }} />

      <div className="flex flex-col gap-2">
        <button
          disabled={logoutPending}
          onClick={onLogout}
          className="w-full rounded-lg px-3 py-[9px] text-[12.5px] font-medium flex items-center justify-center gap-[7px] border transition-colors duration-150 cursor-pointer hover:bg-tertiary disabled:opacity-60 disabled:cursor-default"
          style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
        >
          {logoutPending ? <IconLoader2 size={14} className="animate-auth-spin" /> : <IconLogout2 size={14} />}
          Log out
        </button>
        <button
          disabled={logoutPending}
          onClick={onDeleteRequest}
          className="w-full rounded-lg px-3 py-[9px] text-[12.5px] font-medium flex items-center justify-center gap-[7px] border transition-colors duration-150 cursor-pointer hover:bg-pdf-light disabled:opacity-60 disabled:cursor-default"
          style={{ backgroundColor: 'transparent', color: 'var(--color-pdf)', borderColor: 'var(--color-pdf-border)' }}
        >
          <IconTrash size={14} />
          Delete account
        </button>
      </div>
    </>
  );
}

function ConfirmView({
  email,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  email: string;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <div
        className="w-[46px] h-[46px] rounded-full flex items-center justify-center text-[22px] mx-auto mb-[14px] mt-0.5"
        style={{ backgroundColor: 'var(--color-pdf-light)', color: 'var(--color-pdf)' }}
      >
        <IconAlertTriangle size={22} />
      </div>
      <div
        className="text-[14.5px] font-semibold text-center mb-[6px]"
        style={{ color: 'var(--color-text)' }}
      >
        Delete your account?
      </div>
      <p
        className="text-[12px] text-center leading-relaxed mb-[18px]"
        style={{ color: 'var(--color-text-mid)' }}
      >
        This permanently deletes{' '}
        <strong style={{ color: 'var(--color-text)' }}>{email}</strong> and all
        indexed documents, chat sessions, and memory.{' '}
        <strong style={{ color: 'var(--color-text)' }}>This can&apos;t be undone.</strong>
      </p>
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={onCancel}
          className="flex-1 rounded-lg px-3 py-[9px] text-[12.5px] font-medium flex items-center justify-center gap-[7px] border transition-colors duration-150 cursor-pointer hover:bg-tertiary disabled:opacity-60 disabled:cursor-default"
          style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
        >
          Cancel
        </button>
        <button
          disabled={busy}
          onClick={onConfirm}
          className="flex-1 rounded-lg px-3 py-[9px] text-[12.5px] font-medium flex items-center justify-center gap-[7px] border transition-colors duration-150 cursor-pointer hover:bg-pdf-dark disabled:opacity-60 disabled:cursor-default"
          style={{ backgroundColor: 'var(--color-pdf)', color: '#fff', borderColor: 'var(--color-pdf)' }}
        >
          {busy ? <IconLoader2 size={14} className="animate-auth-spin" /> : <IconTrash size={14} />}
          Delete permanently
        </button>
      </div>
      {error && (
        <div className="mt-3 text-[11px] text-center" style={{ color: 'var(--color-pdf)' }}>
          {error}
        </div>
      )}
    </>
  );
}

export function AccountModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuthState();
  const [view, setView] = useState<View>('profile');
  const logout = useLogout();
  const deleteAccount = useDeleteAccount();
  const email = user?.email ?? '';
  const busy = logout.isPending || deleteAccount.isPending;

  function handleLogout() {
    logout.mutate(undefined, { onSuccess: () => onClose() });
  }

  function handleConfirmDelete() {
    deleteAccount.mutate(undefined, { onSuccess: () => onClose() });
  }

  function handleCancelDelete() {
    deleteAccount.reset();
    setView('profile');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-modal-backdrop-in"
      style={{ backgroundColor: 'rgba(26, 25, 21, 0.42)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
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
          disabled={busy}
          onClick={onClose}
          title="Close"
          className="absolute top-[14px] right-[14px] w-[26px] h-[26px] rounded-[6px] flex items-center justify-center transition-colors hover:bg-secondary disabled:opacity-60"
          style={{ color: 'var(--color-text-light)' }}
        >
          <IconX size={15} />
        </button>

        {view === 'profile' ? (
          <ProfileView
            email={email}
            logoutPending={logout.isPending}
            onLogout={handleLogout}
            onDeleteRequest={() => setView('confirm')}
          />
        ) : (
          <ConfirmView
            email={email}
            busy={deleteAccount.isPending}
            error={deleteAccount.isError ? errorMessage(deleteAccount.error, 'Something went wrong. Please try again.') : null}
            onCancel={handleCancelDelete}
            onConfirm={handleConfirmDelete}
          />
        )}
      </div>
    </div>
  );
}
