import { useEffect, useRef } from 'react';

type Mode = 'fixed' | 'transform';

/**
 * Visual Viewport → keeps an element above the on-screen keyboard.
 *
 * When the keyboard opens, `visualViewport` shrinks; we translate the element
 * up by the difference so it sits flush above the keyboard. No layout
 * thrashing, no timers, no state flags, no scroll race.
 *
 * Two modes:
 *  - `fixed` (default): also pins the element `position: fixed; bottom: 0`
 *    before translating — for overlay surfaces (ModalShell footer,
 *    FoodSearchEmpty create-bar) that must escape their in-flow box.
 *  - `transform`: ONLY applies the translate, leaving positioning to CSS — for
 *    bars already pinned to the bottom (Screen `.bottomBar`) that live inside a
 *    transformed Embla slide, where `position: fixed` would resolve against the
 *    slide rather than the viewport. The translate composes with the slide's
 *    own transform and lifts the bar regardless.
 *
 * `enabled` skips listener registration entirely (a Screen that doesn't host an
 * input bar passes `enabled: false`).
 */
export function useKeyboardStick<T extends HTMLElement>(
  opts: { mode?: Mode; enabled?: boolean; debugId?: string } = {},
) {
  const { mode = 'fixed', enabled = true } = opts;
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      const el = ref.current;
      if (!el) return;

      const offset = window.innerHeight - vv.height - vv.offsetTop;

      if (offset > 50) {
        if (mode === 'fixed') {
          el.style.position = 'fixed';
          el.style.bottom = '0';
          el.style.left = '0';
          el.style.right = '0';
          el.style.zIndex = '10';
        }
        el.style.transform = `translateY(-${offset}px)`;
      } else if (mode === 'fixed') {
        el.removeAttribute('style');
      } else {
        el.style.transform = '';
      }
    };

    handleResize();
    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);

    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
    };
  }, [mode, enabled]);

  return ref;
}
