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
let deviceIdBootstrap: Promise<void> | null = null;

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
//
// The backend mints a fresh device id on *any* protected request that
// arrives without one. If several first-load requests (sessions, documents,
// ...) fired in parallel before this browser had hydrated an id, each would
// get a *different* minted id, and whichever response was captured last
// would silently win — orphaning whatever the others had just created. So
// only the first concurrent caller's request goes out bare; everyone else
// awaits it instead of racing their own. Callers MUST invoke the returned
// release function, in a `finally`, once their request settles (success or
// failure) — that's what unblocks the waiters.
export async function attachDemoDeviceHeader(headers: Headers): Promise<() => void> {
  if (!deviceIdHydrated) {
    demoDeviceId = readCachedDeviceId();
    deviceIdHydrated = true;
  }

  let release: () => void = () => {};
  if (!demoDeviceId && state.isDemo) {
    if (deviceIdBootstrap) {
      await deviceIdBootstrap;
    } else {
      deviceIdBootstrap = new Promise<void>((resolve) => {
        release = () => {
          deviceIdBootstrap = null;
          resolve();
        };
      });
    }
  }

  if (demoDeviceId) headers.set(DEMO_DEVICE_ID_HEADER, demoDeviceId);
  return release;
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
