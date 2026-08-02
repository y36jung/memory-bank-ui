import { getAccessToken, refreshAccessToken } from './auth-store';

const BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export class ApiError extends Error {
  code: string | null;
  status: number;

  constructor(message: string, code: string | null, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

function withAuth(init?: RequestInit): RequestInit {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  // credentials: 'include' — required for the shared demo account's
  // demo_device_id cookie (src/plugins/auth.ts in memory-bank-service) to
  // round-trip on every protected route, not just /auth/refresh. Bearer-token
  // auth alone doesn't need this, but without it the browser silently drops
  // that cross-origin Set-Cookie and never sends it back.
  return { ...init, headers, credentials: 'include' };
}

async function doFetch<T>(path: string, init: RequestInit | undefined, retried: boolean): Promise<T> {
  const res = await fetch(`${BASE}${path}`, withAuth(init));

  if (res.status === 401 && !retried && getAccessToken() !== null) {
    const newToken = await refreshAccessToken();
    if (newToken) return doFetch<T>(path, init, true);
    throw new ApiError('Session expired. Please sign in again.', 'UNAUTHORIZED', 401);
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || json?.error) {
    throw new ApiError(json?.error?.message ?? `HTTP ${res.status}`, json?.error?.code ?? null, res.status);
  }
  return json.data as T;
}

export function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return doFetch<T>(path, init, false);
}

async function doFetchBlob(path: string, init: RequestInit | undefined, retried: boolean): Promise<Blob> {
  const res = await fetch(`${BASE}${path}`, withAuth(init));

  if (res.status === 401 && !retried && getAccessToken() !== null) {
    const newToken = await refreshAccessToken();
    if (newToken) return doFetchBlob(path, init, true);
    throw new ApiError('Session expired. Please sign in again.', 'UNAUTHORIZED', 401);
  }

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new ApiError(json?.error?.message ?? `HTTP ${res.status}`, json?.error?.code ?? null, res.status);
  }
  return res.blob();
}

export function apiFetchBlob(path: string, init?: RequestInit): Promise<Blob> {
  return doFetchBlob(path, init, false);
}

export function apiStreamUrl(path: string): string {
  return `${BASE}${path}`;
}
