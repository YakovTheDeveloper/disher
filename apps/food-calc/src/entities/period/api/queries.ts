import { useQuery } from '@triplit/react';
import { triplit } from '@/api/triplit/client';
import { getCurrentUserId } from '@/api/triplit/session';

export function usePeriods() {
  return useQuery(
    triplit,
    triplit.query('periods').Where('userId', '=', getCurrentUserId())
  );
}
