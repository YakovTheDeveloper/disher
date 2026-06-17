import { describe, it, expect } from 'vitest';
import { asInsights, asObservations } from '../types';

// Frontend mirror of the backend parser (apps/disher-backend-3.0/src/shared/
// analysis-output.ts). The spec (tds/hypotheses-insights.md §2.3, D4, D8)
// requires the SAME valence coercion and the SAME relaxed grounding gate
// (survive on days OR foods) on both sides — the backend twin is covered by
// analysis-output.test.ts; this locks the frontend half so the two can't drift.

describe('asInsights (frontend contract mirror)', () => {
  const day = '01-01-2026';

  it('coerces missing/unknown valence to neutral, keeps positive/negative', () => {
    const out = asInsights([
      { title: 'a', detail: 'd', evidence: { days: [day] } }, // no valence
      { title: 'b', detail: 'd', valence: 'positive', evidence: { days: [day] } },
      { title: 'c', detail: 'd', valence: 'negative', evidence: { days: [day] } },
      { title: 'e', detail: 'd', valence: 'bogus', evidence: { days: [day] } },
    ]);
    expect(out.map((i) => i.valence)).toEqual([
      'neutral',
      'positive',
      'negative',
      'neutral',
    ]);
  });

  it('keeps a foods-only compositional insight (relaxed gate, no days)', () => {
    const out = asInsights([
      {
        title: 'железо + витамин C',
        detail: 'лучше усвоение',
        valence: 'positive',
        evidence: { foods: ['свёкла', 'зелень'] },
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].evidence.days).toEqual([]);
    expect(out[0].evidence.foods).toEqual(['свёкла', 'зелень']);
  });

  it('drops an insight grounded in neither days nor foods', () => {
    const out = asInsights([
      { title: 'events-only', detail: 'd', valence: 'neutral', evidence: { events: ['усталость'] } },
      { title: 'empty', detail: 'd', valence: 'neutral', evidence: {} },
    ]);
    expect(out).toHaveLength(0);
  });

  it('keeps a days-only insight and coerces unknown strength to weak', () => {
    const out = asInsights([
      { title: 'pattern', detail: 'd', valence: 'neutral', strength: 'bogus', evidence: { days: [day] } },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].strength).toBe('weak');
  });

  it('returns [] for non-array / malformed input', () => {
    expect(asInsights(undefined)).toEqual([]);
    expect(asInsights(null)).toEqual([]);
    expect(asInsights('x')).toEqual([]);
    expect(asInsights([{ title: 'no-detail', evidence: { days: [day] } }])).toEqual([]);
  });
});

describe('asObservations (frontend contract mirror)', () => {
  const day = '01-01-2026';

  it('parses a neutral observation — no valence field on the result', () => {
    const out = asObservations([
      { title: 'Поздние ужины', detail: 'после 21:00', strength: 'moderate', evidence: { days: [day] } },
    ]);
    expect(out).toEqual([
      { title: 'Поздние ужины', detail: 'после 21:00', strength: 'moderate', evidence: { days: [day] } },
    ]);
    // @ts-expect-error — an observation never carries a valence field
    expect(out[0].valence).toBeUndefined();
  });

  it('coerces unknown strength to weak and applies the grounding gate (days OR foods)', () => {
    const out = asObservations([
      { title: 'a', detail: 'd', strength: 'bogus', evidence: { days: [day] } },
      { title: 'foods-only', detail: 'd', evidence: { foods: ['свёкла'] } },
      { title: 'ungrounded', detail: 'd', evidence: { events: ['усталость'] } }, // dropped
      { title: 'empty', detail: 'd', evidence: {} }, // dropped
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].strength).toBe('weak');
    expect(out[1].evidence.foods).toEqual(['свёкла']);
  });

  it('ignores a stray valence on an observation entry', () => {
    const out = asObservations([
      { title: 'a', detail: 'd', valence: 'positive', strength: 'weak', evidence: { days: [day] } },
    ]);
    // @ts-expect-error — observations never carry a valence field
    expect(out[0].valence).toBeUndefined();
  });

  it('returns [] for non-array / malformed input', () => {
    expect(asObservations(undefined)).toEqual([]);
    expect(asObservations(null)).toEqual([]);
    expect(asObservations('x')).toEqual([]);
    expect(asObservations([{ title: 'no-detail', evidence: { days: [day] } }])).toEqual([]);
  });
});
