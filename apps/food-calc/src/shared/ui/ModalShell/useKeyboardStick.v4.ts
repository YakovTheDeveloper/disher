import { useEffect, useRef } from 'react';

/**
 * V4: CSS-only with JS CSS-variable bridge.
 *
 * Sets a --kb-offset CSS variable on the element. All positioning is done
 * in CSS via `bottom: var(--kb-offset, 0px)`. No position switching,
 * no transform, no opacity hacks.
 *
 * Pair with CSS:
 *   .actionButtons {
 *     position: fixed;
 *     bottom: var(--kb-offset, 0px);
 *     left: 0; right: 0;
 *     z-index: 10;
 *     transition: bottom 100ms ease-out;
 *   }
 *
 * Pros: separation of concerns (JS only computes offset, CSS does the rest),
 *       easy to add transition/animation in CSS.
 * Cons: element must be position:fixed (not in flow).
 */
export function useKeyboardStickV4<T extends HTMLElement>(_debugId?: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const el = ref.current;
      if (!el) return;

      const offset = window.innerHeight - vv.height - vv.offsetTop;
      el.style.setProperty('--kb-offset', offset > 50 ? `${offset}px` : '0px');
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return ref;
}
