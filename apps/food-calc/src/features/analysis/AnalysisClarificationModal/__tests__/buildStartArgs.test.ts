import { describe, expect, it } from 'vitest';
import { buildStartArgs } from '../buildStartArgs';

const H = [
  { id: 'a', title: 'A', body: 'ba' },
  { id: 'b', title: 'B', body: 'bb' },
  { id: 'c', title: 'C', body: 'bc' },
];

describe('buildStartArgs', () => {
  it('snapshots ticked hypotheses in live-list order ({id,title,body})', () => {
    const args = buildStartArgs(H, new Set(['c', 'a']), '');
    expect(args.hypotheses).toEqual([
      { id: 'a', title: 'A', body: 'ba' },
      { id: 'c', title: 'C', body: 'bc' },
    ]);
  });

  it('drops a ticked id that is no longer in the live list', () => {
    const args = buildStartArgs(H, new Set(['a', 'gone']), '');
    expect(args.hypotheses.map((h) => h.id)).toEqual(['a']);
  });

  it('returns an empty array when nothing is ticked', () => {
    expect(buildStartArgs(H, new Set(), '').hypotheses).toEqual([]);
  });

  it('trims the message', () => {
    expect(buildStartArgs(H, new Set(), '  без сахара  ').userMessage).toBe(
      'без сахара',
    );
  });

  it('omits userMessage (undefined) for empty or whitespace-only text', () => {
    expect(buildStartArgs(H, new Set(), '').userMessage).toBeUndefined();
    expect(buildStartArgs(H, new Set(), '   ').userMessage).toBeUndefined();
  });
});
