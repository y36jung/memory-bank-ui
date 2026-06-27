const BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
  return json.data as T;
}

export function apiStreamUrl(path: string): string {
  return `${BASE}${path}`;
}
