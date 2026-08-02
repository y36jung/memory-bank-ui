import type { User } from './types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  accessToken: string | null;
  isDemo: boolean;
}

const STORAGE_KEY = 'mb_auth_user';
const BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

let state: AuthState = { status: 'loading', user: null, accessToken: null, isDemo: false };
const listeners = new Set<() => void>();
let inFlightRefresh: Promise<string | null> | null = null;

function emit() {
  for (const listener of listeners) listener();
}

// The `isDemo` claim only ever lives in the signed JWT payload — the
// login/register/refresh response bodies never include it. Decoding it here
// (no signature verification needed) is purely for UI gating; the backend
// independently re-verifies and re-enforces `isDemo` on every restricted call.
function decodeIsDemo(accessToken: string): boolean {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return false;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return (JSON.parse(json) as { isDemo?: boolean }).isDemo === true;
  } catch {
    return false;
  }
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
  state = { status: 'authenticated', user, accessToken, isDemo: decodeIsDemo(accessToken) };
  emit();
}

export function setUnauthenticated() {
  writeCachedUser(null);
  state = { status: 'unauthenticated', user: null, accessToken: null, isDemo: false };
  emit();
}

const DEMO_DEVICE_ID_HEADER = 'x-demo-device-id';
const DEVICE_ID_STORAGE_KEY = 'mb_demo_device_id';

let demoDeviceId: string | null = null;
let deviceIdHydrated = false;

function readCachedDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeCachedDeviceId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, id);
  } catch {
    // ignore
  }
}

// Attaches the previously-minted demo_device_id (if any) as a request
// header. Not a bearer credential (memory-bank-service's src/plugins/auth.ts
// — it's a routing key, not a secret), so plain localStorage is fine, unlike
// accessToken which is deliberately kept memory-only.
export function attachDemoDeviceHeader(headers: Headers): void {
  if (!deviceIdHydrated) {
    demoDeviceId = readCachedDeviceId();
    deviceIdHydrated = true;
  }
  if (demoDeviceId) headers.set(DEMO_DEVICE_ID_HEADER, demoDeviceId);
}

// Reads a freshly-minted demo_device_id off an API response, if the backend
// sent one (only happens on the first protected-route call for a browser
// that doesn't have one yet, or after clearing storage).
export function captureDemoDeviceId(res: Response): void {
  const minted = res.headers.get(DEMO_DEVICE_ID_HEADER);
  if (minted && minted !== demoDeviceId) {
    demoDeviceId = minted;
    writeCachedDeviceId(minted);
  }
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
        state = { status: 'authenticated', user, accessToken, isDemo: decodeIsDemo(accessToken) };
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
