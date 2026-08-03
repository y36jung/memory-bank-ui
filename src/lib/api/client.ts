import { getAccessToken, refreshAccessToken, attachDemoDeviceHeader, captureDemoDeviceId } from './auth-store';

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

// credentials: 'include' — required for the refresh_token httpOnly cookie
// to round-trip on /auth/refresh. demo_device_id no longer uses a cookie
// (see attachDemoDeviceHeader/captureDemoDeviceId).
async function fetchWithAuth(path: string, init?: RequestInit): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const release = await attachDemoDeviceHeader(headers);
  try {
    const res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: 'include' });
    captureDemoDeviceId(res);
    return res;
  } finally {
    release();
  }
}

async function doFetch<T>(path: string, init: RequestInit | undefined, retried: boolean): Promise<T> {
  const res = await fetchWithAuth(path, init);

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
  const res = await fetchWithAuth(path, init);

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
