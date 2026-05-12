import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/dexie/schema';
import { mapCustomTagRow } from './mappers';
import type { CustomTag } from '../model/types';

// All custom tags ever typed for `productId`, alphabetised. Returns [] while
// useLiveQuery is on its first tick — callers can default-coalesce.
export function useCustomTagsByProduct(productId: string | null | undefined): CustomTag[] {
  const rows = useLiveQuery(
    async () => {
      if (!productId) return [];
      return db.custom_tags.where('product_id').equals(productId).toArray();
    },
    [productId],
  );
  return useMemo(
    () =>
      [...(rows ?? [])]
        .map(mapCustomTagRow)
        .sort((a, b) => a.tag.localeCompare(b.tag, 'ru')),
    [rows],
  );
}
