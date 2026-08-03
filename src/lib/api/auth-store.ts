import type { User, AuthResponse } from './types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  accessToken: string | null;
  isDemo: boolean;
}

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
  state = { status: 'authenticated', user, accessToken, isDemo: decodeIsDemo(accessToken) };
  emit();
}

export function setUnauthenticated() {
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

// Attaches the demo_device_id header, generating one on the spot if this
// browser doesn't have one cached yet. Generated client-side — the backend
// (memory-bank-service's src/plugins/auth.ts) is a pure consumer, it never
// mints one — so it's decided synchronously, before any request goes out:
// if useChatSessions() and useDocuments() both fire on mount, whichever
// runs first sets demoDeviceId before the second one can even check it, so
// both requests always end up with the same id. Not a bearer credential —
// it's a routing key, not a secret — so plain localStorage is fine, unlike
// accessToken which is deliberately kept memory-only.
export function attachDemoDeviceHeader(headers: Headers): void {
  if (!deviceIdHydrated) {
    demoDeviceId = readCachedDeviceId();
    deviceIdHydrated = true;
  }
  if (!demoDeviceId && state.isDemo) {
    demoDeviceId = crypto.randomUUID();
    writeCachedDeviceId(demoDeviceId);
  }
  if (demoDeviceId) headers.set(DEMO_DEVICE_ID_HEADER, demoDeviceId);
}

export async function refreshAccessToken(): Promise<string | null> {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = (await res.json().catch(() => null)) as { data?: AuthResponse } | null;
      if (!res.ok || !json?.data?.accessToken || !json?.data?.user) {
        setUnauthenticated();
        return null;
      }
      const { user, accessToken } = json.data;
      state = { status: 'authenticated', user, accessToken, isDemo: decodeIsDemo(accessToken) };
      emit();
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
