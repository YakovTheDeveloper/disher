import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStepEnterAnimation } from './useStepEnterAnimation';

// Contract lock for the step-enter appear helper. The animation is CSS
// (untestable in jsdom), but the REPLAY wiring is what the header depends on:
// a fresh `replayKey` on every false→true `active` transition (which remounts
// the animated wrapper so the CSS animation runs again). Steps live through
// ModalByLabel — always mounted — so a mount-only trigger would fire once and
// never again; these tests pin the "bump on re-entry, not on re-render" rule.
describe('useStepEnterAnimation', () => {
  it('returns a stable className plus an initial replayKey', () => {
    const { result } = renderHook(() => useStepEnterAnimation(false));

    expect(typeof result.current.className).toBe('string');
    expect(result.current.className.length).toBeGreaterThan(0);
    expect(result.current.replayKey).toBe(0);
  });

  it('bumps replayKey when active flips false→true (step becomes current)', () => {
    const { result, rerender } = renderHook(({ active }) => useStepEnterAnimation(active), {
      initialProps: { active: false },
    });

    expect(result.current.replayKey).toBe(0);

    rerender({ active: true });
    expect(result.current.replayKey).toBe(1);
  });

  it('does not bump on re-renders that keep active true (no replay on typing)', () => {
    const { result, rerender } = renderHook(({ active }) => useStepEnterAnimation(active), {
      initialProps: { active: false },
    });

    rerender({ active: true });
    expect(result.current.replayKey).toBe(1);

    // Same active — a plain re-render must not replay the animation.
    rerender({ active: true });
    rerender({ active: true });
    expect(result.current.replayKey).toBe(1);
  });

  it('replays again on each re-entry (leave the step, come back)', () => {
    const { result, rerender } = renderHook(({ active }) => useStepEnterAnimation(active), {
      initialProps: { active: false },
    });

    rerender({ active: true }); // enter
    expect(result.current.replayKey).toBe(1);

    rerender({ active: false }); // leave — no bump
    expect(result.current.replayKey).toBe(1);

    rerender({ active: true }); // re-enter — bump
    expect(result.current.replayKey).toBe(2);
  });

  it('stays inert when active is never true (static / single-step consumers)', () => {
    const { result, rerender } = renderHook(() => useStepEnterAnimation());

    rerender();
    rerender();
    expect(result.current.replayKey).toBe(0);
  });
});
