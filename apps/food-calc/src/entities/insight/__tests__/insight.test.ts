import { afterEach, describe, expect, it } from 'vitest';
import { db } from '@/shared/lib/dexie/schema';
import { saveInsight, updateInsight, deleteInsight, mapInsightRow } from '../api';

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

// updateInsight is the user's post-save refinement of the free-text title/detail
// (edit chevron, 2026-07-04). The contract it must honour: touch ONLY the fields
// passed, never the LLM-authored valence/strength/evidence, re-stamp updated_at,
// and no-op cleanly on an empty patch. Assembly/type checks can't see any of this.
describe('updateInsight', () => {
  it('patches only title/detail and re-stamps updated_at, LLM fields untouched', async () => {
    const id = await saveInsight({
      title: 'старое',
      detail: 'старое описание',
      valence: 'negative',
      strength: 'clear',
      evidence: { days: ['13-06-2026'], foods: ['молоко'] },
      source: 'daily',
    });

    // Force an artificially old updated_at (raw put — tests are exempt from the
    // write-contract lint ban) so the re-stamp is observable deterministically,
    // without racing the millisecond clock.
    const seeded = await db.insights.get(id);
    await db.insights.put({ ...seeded!, updated_at: '2000-01-01T00:00:00.000Z' });

    await updateInsight(id, { title: 'новое', detail: 'новое описание' });

    const row = await db.insights.get(id);
    expect(row!.title).toBe('новое');
    expect(row!.detail).toBe('новое описание');
    // The LLM classifies these — a title/detail edit must not disturb them.
    expect(row!.valence).toBe('negative');
    expect(row!.strength).toBe('clear');
    expect(row!.evidence).toEqual({ days: ['13-06-2026'], foods: ['молоко'] });
    // Re-stamped forward past the seeded old value (LWW sync key stays fresh).
    expect(row!.updated_at > '2000-01-01T00:00:00.000Z').toBe(true);
  });

  it('patches title alone without disturbing detail', async () => {
    const id = await saveInsight({
      title: 't',
      detail: 'сохрани меня',
      valence: 'positive',
      strength: 'moderate',
      evidence: { days: ['01-01-2026'] },
      source: 'daily',
    });

    await updateInsight(id, { title: 'только заголовок' });

    const row = await db.insights.get(id);
    expect(row!.title).toBe('только заголовок');
    expect(row!.detail).toBe('сохрани меня');
  });

  it('is a no-op for an empty patch — the row (incl. updated_at) is unchanged', async () => {
    const id = await saveInsight({
      title: 't',
      detail: 'd',
      valence: 'neutral',
      strength: 'weak',
      evidence: { days: ['01-01-2026'] },
      source: 'long',
    });
    const before = await db.insights.get(id);

    await updateInsight(id, {});

    // Empty patch skips updateRow entirely (Object.keys === 0) → nothing moves,
    // not even updated_at.
    const after = await db.insights.get(id);
    expect(after).toEqual(before);
  });
});
