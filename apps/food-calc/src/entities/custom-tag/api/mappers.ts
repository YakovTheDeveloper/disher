import type { CustomTagRow } from '@/shared/lib/dexie/schema';
import type { CustomTag } from '../model/types';

export function mapCustomTagRow(row: CustomTagRow): CustomTag {
  return {
    id: row.id,
    productId: row.product_id,
    tag: row.tag,
    createdAt: row.created_at,
  };
}
