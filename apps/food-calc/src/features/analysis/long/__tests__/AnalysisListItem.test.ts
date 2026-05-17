import { describe, it, expect } from 'vitest';
import { deriveStatus, STALE_PENDING_MS, type Analysis } from '../../api';

const NOW = Date.parse('2026-05-15T12:00:00Z');

function mk(over: Partial<Analysis>): Analysis {
  return {
    id: 'a-1',
    windowStart: '2026-05-01T00:00:00Z',
    windowEnd: '2026-05-08T00:00:00Z',
    resultMd: '',
    ideaCards: [],
    appliedHypotheses: [],
    createdAt: new Date(NOW).toISOString(),
    ...over,
  };
}

describe('deriveStatus', () => {
  it('marks a "⚠️"-prefixed result as failed', () => {
    const a = mk({ resultMd: '⚠️ Анализ не удался: invalid-output' });
    expect(deriveStatus(a, NOW)).toBe('failed');
  });

  it('marks a non-empty plain result as done', () => {
    expect(deriveStatus(mk({ resultMd: '## разбор' }), NOW)).toBe('done');
  });

  it('marks a fresh empty result as running', () => {
    const a = mk({
      resultMd: '',
      createdAt: new Date(NOW - 5 * 60 * 1000).toISOString(),
    });
    expect(deriveStatus(a, NOW)).toBe('running');
  });

  it('marks an old empty result as stale', () => {
    const a = mk({
      resultMd: '',
      createdAt: new Date(NOW - 20 * 60 * 1000).toISOString(),
    });
    expect(deriveStatus(a, NOW)).toBe('stale');
  });

  it('treats exactly STALE_PENDING_MS old as still running (boundary)', () => {
    const a = mk({
      resultMd: '',
      createdAt: new Date(NOW - STALE_PENDING_MS).toISOString(),
    });
    expect(deriveStatus(a, NOW)).toBe('running');
  });

  it('one ms past the boundary flips to stale', () => {
    const a = mk({
      resultMd: '',
      createdAt: new Date(NOW - STALE_PENDING_MS - 1).toISOString(),
    });
    expect(deriveStatus(a, NOW)).toBe('stale');
  });
});
