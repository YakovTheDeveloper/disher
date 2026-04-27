import { useAuthStore } from '@/features/auth/auth-store';

export function useUserId(): string | null {
  return useAuthStore((s) => s.userId);
}

export function getUserIdSync(): string | null {
  return useAuthStore.getState().userId;
}
