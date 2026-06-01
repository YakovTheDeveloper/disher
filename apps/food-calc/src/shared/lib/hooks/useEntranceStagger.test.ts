import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEntranceStagger } from './useEntranceStagger';

// Contract lock for the staggered list-entrance helper. The animation itself is
// CSS (untestable in jsdom), but the wiring — a class + the per-row `--enter-i`
// index the stylesheet reads for its delay — is what every consumer depends on.
// If someone re-adds motion, renames the var, or unhooks the className, these
// break instead of the cascade silently dying in the browser.
describe('useEntranceStagger', () => {
  it('returns the entrance class + the index as the --enter-i custom property', () => {
    const { result } = renderHook(() => useEntranceStagger(5));

    expect(typeof result.current.className).toBe('string');
    expect(result.current.className.length).toBeGreaterThan(0);
    expect((result.current.style as Record<string, number>)['--enter-i']).toBe(5);
  });

  it('defaults the stagger index to 0 when called without an argument', () => {
    const { result } = renderHook(() => useEntranceStagger());

    expect((result.current.style as Record<string, number>)['--enter-i']).toBe(0);
  });

  it('returns the same class for every index (cascade is delay-only, not per-index classes)', () => {
    const { result: first } = renderHook(() => useEntranceStagger(0));
    const { result: last } = renderHook(() => useEntranceStagger(9));

    expect(first.current.className).toBe(last.current.className);
  });
});
