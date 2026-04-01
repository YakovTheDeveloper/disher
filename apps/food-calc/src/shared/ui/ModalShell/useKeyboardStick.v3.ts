import { useEffect, useRef } from 'react';

/**
 * V3: Virtual Keyboard API (Chrome 94+, Edge 94+) with Visual Viewport fallback.
 *
 * Uses navigator.virtualKeyboard.overlaysContent = true so the browser
 * doesn't auto-resize the viewport. Instead we read the keyboard geometry
 * from the 'geometrychange' event and position via CSS env() or JS.
 *
 * For Safari (no Virtual Keyboard API), falls back to Visual Viewport resize.
 *
 * Pros: most "native" approach, no guessing keyboard height.
 * Cons: Virtual Keyboard API not in Safari yet (as of 2025).
 */
export function useKeyboardStickV3<T extends HTMLElement>(_debugId?: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Always fixed at bottom
    el.style.position = 'fixed';
    el.style.bottom = '0';
    el.style.left = '0';
    el.style.right = '0';
    el.style.zIndex = '10';

    // ── Path A: Virtual Keyboard API ──
    const vk = (navigator as any).virtualKeyboard;
    if (vk) {
      vk.overlaysContent = true;

      const onGeometryChange = () => {
        const kbHeight = vk.boundingRect.height;
        el.style.transform = kbHeight > 0 ? `translateY(-${kbHeight}px)` : '';
      };

      vk.addEventListener('geometrychange', onGeometryChange);
      return () => {
        vk.overlaysContent = false;
        vk.removeEventListener('geometrychange', onGeometryChange);
      };
    }

    // ── Path B: Visual Viewport fallback (Safari, older browsers) ──
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      el.style.transform = offset > 50 ? `translateY(-${offset}px)` : '';
    };

    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);

    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
    };
  }, []);

  return ref;
}
