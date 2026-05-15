import { describe, expect, it } from 'vitest';
import { stripLegacyHypothesisFields } from '../schema';

// The Dexie v6 upgrade runs stripLegacyHypothesisFields over every existing
// hypothesis row via `.modify()`. On a fresh device the table is empty and
// `.modify()` simply never invokes the callback — so the only logic worth a
// unit test is the field stripping itself.
describe('Dexie v6 hypothesis migration — stripLegacyHypothesisFields', () => {
  it('drops all seven lifecycle columns, keeps the core four', () => {
    const row: Record<string, unknown> = {
      id: 'h1',
      title: 'без молочки',
      body: 'проверяю неделю',
      created_at: '2026-05-13T10:00:00.000Z',
      days: 7,
      started_at: '2026-05-01T00:00:00.000Z',
      ended_at: null,
      outcome: 'стало легче',
      source_analysis_id: 'a1',
      note: 'приватная заметка',
      saved_at: '2026-05-10T00:00:00.000Z',
    };

    stripLegacyHypothesisFields(row);

    expect(row).toEqual({
      id: 'h1',
      title: 'без молочки',
      body: 'проверяю неделю',
      created_at: '2026-05-13T10:00:00.000Z',
    });
  });

  it('is a no-op on an already-simplified row', () => {
    const row: Record<string, unknown> = {
      id: 'h2',
      title: 't',
      body: 'b',
      created_at: '2026-05-13T10:00:00.000Z',
    };

    stripLegacyHypothesisFields(row);

    expect(row).toEqual({
      id: 'h2',
      title: 't',
      body: 'b',
      created_at: '2026-05-13T10:00:00.000Z',
    });
  });
});
