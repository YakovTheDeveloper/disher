/**
 * Overlay back-gesture coordinator.
 *
 * Closes the topmost overlay on browser back / Android-back / iOS-swipe via the
 * Navigation API. No fake history entries are pushed — URL stays untouched while
 * overlays open and close.
 *
 * Fallback for browsers without `window.navigation` (Safari < TP 18.4): a bare
 * popstate listener that closes the topmost overlay. URL will have already
 * traversed at that point — the close is honest, not transparent.
 *
 * Imported as a side-effect from `app/index.tsx` so the listener is registered
 * before `createBrowserRouter` initializes its own listeners.
 */

const closeHandlerStack: Array<() => void> = [];

export function registerCloseHandler(fn: () => void): void {
  closeHandlerStack.push(fn);
}

export function unregisterCloseHandler(fn: () => void): void {
  const idx = closeHandlerStack.lastIndexOf(fn);
  if (idx !== -1) closeHandlerStack.splice(idx, 1);
}

function closeTop(): boolean {
  if (closeHandlerStack.length === 0) return false;
  closeHandlerStack[closeHandlerStack.length - 1]();
  return true;
}

if (typeof window !== 'undefined') {
  const nav = (window as unknown as { navigation?: EventTarget }).navigation;
  if (nav && typeof nav.addEventListener === 'function') {
    nav.addEventListener('navigate', (e: Event) => {
      const ev = e as Event & {
        navigationType?: string;
        preventDefault: () => void;
      };
      if (ev.navigationType !== 'traverse') return;
      if (closeHandlerStack.length === 0) return;
      ev.preventDefault();
      closeTop();
    });
  } else {
    // Safari < TP 18.4 / older Chromium. Without Navigation API we can't block
    // traverse — the URL will have changed by the time popstate fires. We still
    // call closeTop so the React tree doesn't keep rendering a stale overlay.
    window.addEventListener('popstate', () => {
      closeTop();
    });
  }
}
