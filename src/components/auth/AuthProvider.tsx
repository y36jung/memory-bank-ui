'use client';

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import {
  getAuthSnapshot,
  subscribeAuthState,
  refreshAccessToken,
  type AuthState,
} from '@/lib/api/auth-store';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribeAuthState, getAuthSnapshot, getAuthSnapshot);

  useEffect(() => {
    refreshAccessToken();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuthState(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthState must be used within AuthProvider');
  return ctx;
}
