import { afterEach, describe, expect, it } from 'vitest';
import { db } from '@/shared/lib/dexie/schema';
import { saveInsight, deleteInsight, mapInsightRow } from '../api';

afterEach(async () => {
  await db.insights.clear();
  await db.tombstones.clear();
});

describe('insight entity round-trip', () => {
  it('saveInsight writes a row that maps back to the same Insight', async () => {
    const id = await saveInsight({
      title: 'железо + витамин C',
      detail: 'лучше усвоение',
      valence: 'positive',
      strength: 'moderate',
      evidence: { days: [], foods: ['свёкла', 'зелень'] },
      source: 'dish',
    });

    const row = await db.insights.get(id);
    expect(row).toBeTruthy();

    const insight = mapInsightRow(row!);
    expect(insight).toMatchObject({
      id,
      title: 'железо + витамин C',
      detail: 'лучше усвоение',
      valence: 'positive',
      strength: 'moderate',
      source: 'dish',
      evidence: { days: [], foods: ['свёкла', 'зелень'] },
    });
    expect(insight.createdAt).toBeTruthy();
  });

  it('drops empty optional evidence lists on save (foods/events omitted)', async () => {
    const id = await saveInsight({
      title: 'pattern',
      detail: 'd',
      valence: 'neutral',
      strength: 'weak',
      evidence: { days: ['01-01-2026'] },
      source: 'daily',
    });

    const row = await db.insights.get(id);
    expect(row!.evidence).toEqual({ days: ['01-01-2026'] }); // no foods/events keys

    const insight = mapInsightRow(row!);
    expect(insight.evidence.foods).toBeUndefined();
    expect(insight.evidence.events).toBeUndefined();
  });

  it('deleteInsight removes the row and records a tombstone', async () => {
    const id = await saveInsight({
      title: 't',
      detail: 'd',
      valence: 'neutral',
      strength: 'weak',
      evidence: { days: ['01-01-2026'] },
      source: 'long',
    });

    await deleteInsight(id);

    expect(await db.insights.get(id)).toBeUndefined();
    expect(await db.tombstones.get(id)).toMatchObject({ id, table: 'insights' });
  });
});
