import { useSyncExternalStore } from 'react';
import { getPendingCount, subscribePending } from '@/shared/lib/storage/pendingWrites';

export function usePendingCount(): number {
  return useSyncExternalStore(subscribePending, getPendingCount, getPendingCount);
}
