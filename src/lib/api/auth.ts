import { apiFetch } from './client';
import type { AuthResponse } from './types';

export interface AuthCredentials {
  email: string;
  password: string;
}

export async function register(credentials: AuthCredentials): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });
}

export async function login(credentials: AuthCredentials): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });
}

export async function logout(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
}

export async function deleteAccount(): Promise<void> {
  await apiFetch<{ deleted: boolean }>('/auth/me', { method: 'DELETE' });
}
