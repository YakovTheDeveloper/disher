/**
 * Overlay History Coordinator
 *
 * Pushes sentinel history entries when overlays open,
 * so that browser Back closes the topmost overlay instead of navigating away.
 */

const closeHandlerStack: (() => void)[] = [];
let sentinelCount = 0;
let closingFromPopstate = false;
let programmaticBack = false;

export function pushOverlayEntry(): void {
  sentinelCount++;
  history.pushState({ __overlay: sentinelCount }, '');
}

export function popOverlayEntry(): Promise<void> {
  if (sentinelCount > 0) {
    sentinelCount--;
    return new Promise<void>((resolve) => {
      const onPop = () => {
        window.removeEventListener('popstate', onPop);
        resolve();
      };
      window.addEventListener('popstate', onPop);
      programmaticBack = true;
      history.back();
    });
  }
  return Promise.resolve();
}

export function registerCloseHandler(fn: () => void): void {
  closeHandlerStack.push(fn);
}

export function unregisterCloseHandler(fn: () => void): void {
  const idx = closeHandlerStack.indexOf(fn);
  if (idx !== -1) closeHandlerStack.splice(idx, 1);
}

export function isPopstateClosing(): boolean {
  return closingFromPopstate;
}

window.addEventListener('popstate', () => {
  // Ignore popstate triggered by our own programmatic history.back()
  if (programmaticBack) {
    programmaticBack = false;
    return;
  }

  if (sentinelCount > 0 && closeHandlerStack.length > 0) {
    sentinelCount--;
    closingFromPopstate = true;
    closeHandlerStack[closeHandlerStack.length - 1]();
    closingFromPopstate = false;
  }
});
