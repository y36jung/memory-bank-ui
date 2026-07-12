'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login, register, logout, deleteAccount, type AuthCredentials } from '@/lib/api/auth';
import { setAuthenticated, setUnauthenticated } from '@/lib/api/auth-store';

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: AuthCredentials) => login(credentials),
    onSuccess: (result) => setAuthenticated(result.user, result.accessToken),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (credentials: AuthCredentials) => register(credentials),
    onSuccess: (result) => setAuthenticated(result.user, result.accessToken),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      setUnauthenticated();
      queryClient.clear();
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteAccount(),
    onSuccess: () => {
      setUnauthenticated();
      queryClient.clear();
    },
  });
}
