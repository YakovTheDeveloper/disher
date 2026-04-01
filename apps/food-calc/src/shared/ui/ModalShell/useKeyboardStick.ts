import { useEffect, useRef } from 'react';

const FADE_MS = 120;

/**
 * Pins an element just above the virtual keyboard.
 *
 * Default: element at the bottom of the modal (CSS margin-top: auto).
 * Keyboard open: position:fixed above the keyboard, rAF-tracked.
 *
 * Transitions between states use opacity fade to hide the layout jump.
 */
export function useKeyboardStick<T extends HTMLElement>(debugId?: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const el = ref.current;
    if (!el) return;

    let rafId = 0;
    let isTracking = false;
    let isPinned = false;
    let unpinTimer = 0;
    let fadeTimer = 0;
    let expandRafId = 0;

    const getModalContainer = () => el.closest('[data-modal-by-label]');

    const isModalExpanded = () => {
      const container = getModalContainer();
      if (!container) return true; // no ModalByLabel wrapper — always visible
      return container.getAttribute('data-modal-by-label') === 'expanded';
    };

    /** Check if a DOM event target belongs to the same modal as this element. */
    const isEventFromOwnModal = (target: EventTarget | null) => {
      const modalContainer = getModalContainer();
      if (!modalContainer) return true; // no modal wrapper — treat all events as own
      return modalContainer.contains(target as Node);
    };

    const pin = () => {
      const bottom = vv.offsetTop + vv.height;

      if (!isPinned) {
        // Fade out at current position
        el.style.transition = `opacity ${FADE_MS}ms ease-out`;
        el.style.opacity = '0';

        fadeTimer = window.setTimeout(() => {
          // Switch to fixed while invisible
          el.style.position = 'fixed';
          el.style.left = '0';
          el.style.right = '0';
          el.style.zIndex = '10';
          el.style.top = `${bottom}px`;
          el.style.transform = 'translateY(-100%)';
          isPinned = true;

          // Force layout then fade in
          el.getBoundingClientRect();
          el.style.transition = `opacity ${FADE_MS}ms ease-in`;
          el.style.opacity = '1';

          // Clean up transition after fade-in
          setTimeout(() => {
            el.style.transition = '';
          }, FADE_MS);
        }, FADE_MS);

        return;
      }

      // Already pinned — just update position (no transition needed)
      el.style.top = `${bottom}px`;
      el.style.transform = 'translateY(-100%)';
    };

    const unpin = () => {
      if (!isPinned) return;

      // Fade out at fixed position
      el.style.transition = `opacity ${FADE_MS}ms ease-out`;
      el.style.opacity = '0';

      fadeTimer = window.setTimeout(() => {
        // Remove all inline styles — back to CSS layout
        el.removeAttribute('style');
        window.scrollTo(0, 0);
        isPinned = false;

        // Invisible in new position — fade in
        el.style.opacity = '0';
        el.getBoundingClientRect();
        el.style.transition = `opacity ${FADE_MS}ms ease-in`;
        el.style.opacity = '1';

        setTimeout(() => {
          el.removeAttribute('style');
        }, FADE_MS);
      }, FADE_MS);
    };

    const loop = () => {
      if (!isPinned) {
        // First call — initiate pin with fade
        pin();
      } else {
        // Already pinned — just track position
        const bottom = vv.offsetTop + vv.height;
        el.style.top = `${bottom}px`;
        el.style.transform = 'translateY(-100%)';
      }
      if (isTracking) {
        rafId = requestAnimationFrame(loop);
      }
    };

    const startTracking = () => {
      clearTimeout(unpinTimer);
      clearTimeout(fadeTimer);
      cancelAnimationFrame(expandRafId);

      // If mid-fade with opacity:0 but not yet pinned, reset to clean state
      if (!isPinned && !isTracking) {
        el.removeAttribute('style');
      }

      if (isTracking) return;
      isTracking = true;
      loop();
    };

    const stopTracking = () => {
      isTracking = false;
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(expandRafId);
      clearTimeout(fadeTimer);
      unpinTimer = window.setTimeout(unpin, 350);
    };

    const onFocusIn = (e: FocusEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') return;

      // Only react to focus events within our own modal
      if (!isEventFromOwnModal(e.target)) return;

      if (!isModalExpanded()) {
        // Modal is transitioning from collapsed → expanded.
        // Wait until it's fully expanded before starting.
        cancelAnimationFrame(expandRafId);
        const waitForExpand = () => {
          if (isModalExpanded()) {
            startTracking();
          } else {
            expandRafId = requestAnimationFrame(waitForExpand);
          }
        };
        expandRafId = requestAnimationFrame(waitForExpand);
        return;
      }

      startTracking();
    };

    const onFocusOut = (e: FocusEvent) => {
      // Only react to blur events from within our own modal
      if (!isEventFromOwnModal(e.target)) return;
      stopTracking();
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);

    // ── DEBUG: log action-buttons position every 500ms (only for matching debugId) ──
    const debugInterval = debugId
      ? setInterval(() => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const vvHeight = vv.height;
          const vvOffsetTop = vv.offsetTop;
          const computed = getComputedStyle(el);
          console.log(
            `[KB-STICK ${debugId}] pinned=${isPinned} tracking=${isTracking}`,
            `| rect: top=${Math.round(rect.top)} bot=${Math.round(rect.bottom)} h=${Math.round(rect.height)}`,
            `| vv: h=${Math.round(vvHeight)} offTop=${Math.round(vvOffsetTop)}`,
            `| pos=${el.style.position || computed.position} top=${el.style.top || 'auto'}`,
            `| opacity=${el.style.opacity || computed.opacity}`,
            `| visible=${rect.bottom > 0 && rect.top < window.innerHeight}`,
          );
        }, 500)
      : null;

    return () => {
      if (debugInterval) clearInterval(debugInterval);
      isTracking = false;
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(expandRafId);
      clearTimeout(unpinTimer);
      clearTimeout(fadeTimer);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  return ref;
}
