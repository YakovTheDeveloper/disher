import type { HypothesisRow } from '@/shared/lib/dexie/schema';
import type { Hypothesis } from '../model/types';

export function mapHypothesisRow(row: HypothesisRow): Hypothesis {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
  };
}
