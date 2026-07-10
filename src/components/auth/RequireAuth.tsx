'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IconLoader2 } from '@tabler/icons-react';
import { useAuthState } from './AuthProvider';

function FullScreenSpinner() {
  return (
    <div
      className="flex items-center justify-center h-screen"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <IconLoader2 size={22} className="animate-spin" style={{ color: 'var(--color-teal)' }} />
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status === 'loading') return <FullScreenSpinner />;
  if (status === 'unauthenticated') return null;
  return <>{children}</>;
}

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { status } = useAuthState();
  const router = useRouter();

  // Only auto-redirect when the user *arrives* already authenticated (existing
  // session on mount). If auth happens as a result of submitting the form on
  // this very page, let the success panel render — its own "Continue" button
  // handles navigating home.
  const wasUnauthenticated = useRef(false);
  if (status === 'unauthenticated') wasUnauthenticated.current = true;

  useEffect(() => {
    if (status === 'authenticated' && !wasUnauthenticated.current) router.replace('/');
  }, [status, router]);

  if (status === 'loading') return <FullScreenSpinner />;
  if (status === 'authenticated' && !wasUnauthenticated.current) return null;
  return <>{children}</>;
}
