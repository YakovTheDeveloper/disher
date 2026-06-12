import { describe, it, expect } from 'vitest';
import type { Analysis } from '../../api';
import { restartArgs } from '../restart';

function mk(over: Partial<Analysis>): Analysis {
  return {
    id: 'a-1',
    windowStart: '2026-05-01T00:00:00Z',
    windowEnd: '2026-05-15T00:00:00Z',
    summary: '',
    insights: [],
    hypotheses: [],
    appliedHypotheses: [],
    createdAt: '2026-05-15T12:00:00Z',
    ...over,
  };
}

describe('restartArgs', () => {
  it('reuses the same window and produces inclusive dd-MM-yyyy day keys', () => {
    const args = restartArgs(mk({}));
    expect(args.windowStart).toBe('2026-05-01T00:00:00Z');
    expect(args.windowEnd).toBe('2026-05-15T00:00:00Z');
    expect(args.dayKeys[0]).toBe('01-05-2026');
    expect(args.dayKeys[args.dayKeys.length - 1]).toBe('15-05-2026');
    expect(args.dayKeys).toHaveLength(15);
  });

  it('carries the hypotheses snapshot when the analysis had any', () => {
    const args = restartArgs(
      mk({
        appliedHypotheses: [
          { id: 'h-1', title: 'Меньше сахара', body: 'после обеда' },
        ],
      }),
    );
    expect(args.hypotheses).toEqual([
      { id: 'h-1', title: 'Меньше сахара', body: 'после обеда' },
    ]);
  });

  it('omits the hypotheses key entirely when none were applied', () => {
    const args = restartArgs(mk({ appliedHypotheses: [] }));
    expect('hypotheses' in args).toBe(false);
  });
});
