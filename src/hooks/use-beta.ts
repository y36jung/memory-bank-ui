'use client';

import { useAuthState } from '@/components/auth/AuthProvider';

/** True if the currently authenticated user is the restricted shared demo account. */
export function useIsDemoAccount(): boolean {
  return useAuthState().isDemo;
}
