import { useEffect, useRef } from 'react';

/**
 * Visual Viewport + transform: element stays position:fixed; bottom:0 always.
 * When keyboard opens, visualViewport shrinks — we translate the element up
 * by the difference so it sits above the keyboard.
 *
 * No layout thrashing, no timers, no state flags. Requires position:fixed in CSS.
 */
export function useKeyboardStick<T extends HTMLElement>(_debugId?: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      const el = ref.current;
      if (!el) return;

      const offset = window.innerHeight - vv.height - vv.offsetTop;

      if (offset > 50) {
        el.style.position = 'fixed';
        el.style.bottom = '0';
        el.style.left = '0';
        el.style.right = '0';
        el.style.zIndex = '10';
        el.style.transform = `translateY(-${offset}px)`;
      } else {
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
