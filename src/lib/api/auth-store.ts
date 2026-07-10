import type { User } from './types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  accessToken: string | null;
}

const STORAGE_KEY = 'mb_auth_user';
const BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

let state: AuthState = { status: 'loading', user: null, accessToken: null };
const listeners = new Set<() => void>();
let inFlightRefresh: Promise<string | null> | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function readCachedUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeCachedUser(user: User | null) {
  if (typeof window === 'undefined') return;
  if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(STORAGE_KEY);
}

export function subscribeAuthState(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAuthSnapshot(): AuthState {
  return state;
}

export function getAccessToken(): string | null {
  return state.accessToken;
}

export function setAuthenticated(user: User, accessToken: string) {
  writeCachedUser(user);
  state = { status: 'authenticated', user, accessToken };
  emit();
}

export function setUnauthenticated() {
  writeCachedUser(null);
  state = { status: 'unauthenticated', user: null, accessToken: null };
  emit();
}

export async function refreshAccessToken(): Promise<string | null> {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data?.accessToken) {
        setUnauthenticated();
        return null;
      }
      const accessToken = json.data.accessToken as string;
      const user = state.user ?? readCachedUser();
      if (user) {
        state = { status: 'authenticated', user, accessToken };
        emit();
      } else {
        setUnauthenticated();
        return null;
      }
      return accessToken;
    } catch {
      setUnauthenticated();
      return null;
    }
  })();

  try {
    return await inFlightRefresh;
  } finally {
    inFlightRefresh = null;
  }
}
