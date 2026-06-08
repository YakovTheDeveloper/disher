import { describe, expect, it } from 'vitest';
import { buildStartArgs } from '../buildStartArgs';

const H = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('buildStartArgs', () => {
  it('maps ticked ids in live-list order', () => {
    const args = buildStartArgs(H, new Set(['c', 'a']), '');
    expect(args.hypothesisIds).toEqual(['a', 'c']);
  });

  it('drops a ticked id that is no longer in the live list', () => {
    const args = buildStartArgs(H, new Set(['a', 'gone']), '');
    expect(args.hypothesisIds).toEqual(['a']);
  });

  it('returns an empty array when nothing is ticked', () => {
    expect(buildStartArgs(H, new Set(), '').hypothesisIds).toEqual([]);
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
