import { describe, expect, it } from 'vitest';
import {
  extractCustomTokens,
  hasTag,
  joinTokens,
  normalizeTag,
  tokenize,
  toggleTag,
} from '../tags';

describe('normalizeTag', () => {
  it('lowercases Cyrillic', () => {
    expect(normalizeTag('Жареное')).toBe('жареное');
    expect(normalizeTag('ВАРЁНОЕ')).toBe('варёное');
  });

  it('trims whitespace', () => {
    expect(normalizeTag('  жареное  ')).toBe('жареное');
  });

  it('applies NFC normalisation', () => {
    // 'ё' = U+0451 (single codepoint, NFC); composed form passes through.
    const composed = 'ё';
    // Combining form (e + combining diaeresis) → should normalise to composed.
    const decomposed = 'ë'; // 'ё' (English e + ̈) — naive test of NFC
    expect(normalizeTag(composed)).toBe('ё');
    expect(normalizeTag(decomposed).normalize('NFC')).toBe(
      decomposed.normalize('NFC'),
    );
  });

  it('returns empty for whitespace-only input', () => {
    expect(normalizeTag('   ')).toBe('');
    expect(normalizeTag('')).toBe('');
  });
});

describe('tokenize', () => {
  it('splits on commas with optional whitespace', () => {
    expect(tokenize('жареное, без масла,с корочкой')).toEqual([
      'жареное',
      'без масла',
      'с корочкой',
    ]);
  });

  it('normalises case + dedups within a string', () => {
    expect(tokenize('Жареное, жареное, Без масла')).toEqual([
      'жареное',
      'без масла',
    ]);
  });

  it('drops empty tokens and stray commas', () => {
    expect(tokenize(', жареное, , без масла,')).toEqual([
      'жареное',
      'без масла',
    ]);
  });

  it('returns [] for empty input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('joinTokens', () => {
  it('joins with comma+space', () => {
    expect(joinTokens(['жареное', 'без масла'])).toBe('жареное, без масла');
  });

  it('handles empty array', () => {
    expect(joinTokens([])).toBe('');
  });
});

describe('toggleTag', () => {
  it('adds a missing tag', () => {
    expect(toggleTag('жареное', 'без масла')).toBe('жареное, без масла');
  });

  it('removes a present tag', () => {
    expect(toggleTag('жареное, без масла', 'жареное')).toBe('без масла');
  });

  it('is case-insensitive', () => {
    expect(toggleTag('жареное, без масла', 'Жареное')).toBe('без масла');
  });

  it('idempotent in pairs (add then remove restores)', () => {
    const start = 'жареное';
    const added = toggleTag(start, 'без масла');
    expect(toggleTag(added, 'без масла')).toBe(start);
  });

  it('keeps order when adding', () => {
    expect(toggleTag('жареное, без масла', 'спелое')).toBe(
      'жареное, без масла, спелое',
    );
  });

  it('dedups when adding a tag that differs only by case', () => {
    expect(toggleTag('Жареное, без масла', 'ЖАРЕНОЕ')).toBe('без масла');
  });
});

describe('hasTag', () => {
  it('returns true for matching tag (case-insensitive)', () => {
    expect(hasTag('жареное, без масла', 'Жареное')).toBe(true);
  });

  it('returns false for missing tag', () => {
    expect(hasTag('жареное', 'спелое')).toBe(false);
  });

  it('returns false for empty inputs', () => {
    expect(hasTag('', 'жареное')).toBe(false);
    expect(hasTag('жареное', '')).toBe(false);
  });
});

describe('extractCustomTokens', () => {
  it('keeps tokens not in the known set', () => {
    const known = new Set(['жареное', 'варёное']);
    expect(extractCustomTokens('жареное, домашнее, дядиной рукой', known)).toEqual([
      'домашнее',
      'дядиной рукой',
    ]);
  });

  it('returns [] when every token is known', () => {
    const known = new Set(['жареное', 'варёное']);
    expect(extractCustomTokens('жареное, ВАРЁНОЕ', known)).toEqual([]);
  });

  it('matches case-insensitively against the known set', () => {
    const known = new Set(['жареное']);
    expect(extractCustomTokens('ЖАРЕНОЕ, домашнее', known)).toEqual(['домашнее']);
  });
});
