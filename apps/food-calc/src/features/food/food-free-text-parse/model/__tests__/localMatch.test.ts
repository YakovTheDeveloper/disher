import { describe, expect, it } from 'vitest';

import {
  LOCAL_MATCH_MIN_DICE,
  matchLocalProduct,
  normalizeLocal,
  type LocalMatchCandidate,
} from '../localMatch';

describe('normalizeLocal', () => {
  it('lowercases, folds ё→е, strips punctuation and collapses whitespace', () => {
    expect(normalizeLocal('  Свёкла,  ВАРЁНАЯ! ')).toBe('свекла вареная');
  });
});

describe('matchLocalProduct', () => {
  const candidates: LocalMatchCandidate[] = [
    { id: 'p-tvorog', name: 'Творог' },
    { id: 'p-tvorog5', name: 'Творог 5%' },
    { id: 'p-ovsyanka', name: 'Овсянка' },
    { id: 'p-protein', name: 'Мой протеин' },
  ];

  it('returns a perfect score for an exact (normalized) match', () => {
    const m = matchLocalProduct('овсянка', candidates);
    expect(m?.id).toBe('p-ovsyanka');
    expect(m?.score).toBe(1);
  });

  it('matches across ё/case/punctuation differences', () => {
    // Server-side normalization folds ё→е, so "Свёкла" ↔ "свекла" is exact.
    const m = matchLocalProduct('Свёкла', [{ id: 'p-beet', name: 'Свекла' }]);
    expect(m?.id).toBe('p-beet');
    expect(m?.score).toBe(1);
  });

  it('picks the highest-scoring candidate when several are similar', () => {
    // "Творог" is exact against p-tvorog and only partial against "Творог 5%".
    const m = matchLocalProduct('творог', candidates);
    expect(m?.id).toBe('p-tvorog');
  });

  it('returns null when nothing clears the threshold', () => {
    expect(matchLocalProduct('стейк из лосося', candidates)).toBeNull();
  });

  it('returns null for empty candidates or empty query', () => {
    expect(matchLocalProduct('творог', [])).toBeNull();
    expect(matchLocalProduct('   ', candidates)).toBeNull();
  });

  it('respects a custom minScore', () => {
    // A loose partial that fails at 0.8 can pass at a lower bar.
    const loose = matchLocalProduct('протеин', candidates, 0.4);
    expect(loose?.id).toBe('p-protein');
    expect(matchLocalProduct('протеин', candidates, LOCAL_MATCH_MIN_DICE)).toBeNull();
  });
});
