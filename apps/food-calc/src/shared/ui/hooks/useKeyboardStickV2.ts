import { useEffect, useRef } from 'react';

/**
 * V2: Visual Viewport + transform (no position switch, no rAF loop, no opacity fade).
 *
 * Element stays position:fixed; bottom:0 always.
 * When keyboard opens, visualViewport shrinks — we translate the element up
 * by the difference so it sits above the keyboard.
 *
 * Pros: no layout thrashing, no timers, no state flags.
 * Cons: requires position:fixed in CSS (not margin-top:auto flow).
 */
export function useKeyboardStickV2<T extends HTMLElement>(_debugId?: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      const el = ref.current;
      if (!el) return;

      // How much the viewport shrank (keyboard height + any scroll offset)
      const offset = window.innerHeight - vv.height - vv.offsetTop;

      if (offset > 50) {
        // Keyboard is likely open — lift the element
        el.style.position = 'fixed';
        el.style.bottom = '0';
        el.style.left = '0';
        el.style.right = '0';
        el.style.zIndex = '10';
        el.style.transform = `translateY(-${offset}px)`;
      } else {
        // Keyboard closed — reset to flow
        el.removeAttribute('style');
      }
    };

    handleResize();
    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);

    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
    };
  }, []);

  return ref;
}
