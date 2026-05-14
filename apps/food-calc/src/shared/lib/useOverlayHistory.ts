import { useEffect, useRef } from 'react';
import { registerCloseHandler, unregisterCloseHandler } from './overlay-history';

/**
 * Registers `onClose` as the top-of-stack close handler while `isExpanded` is true,
 * so that browser Back / Android-back / iOS-swipe close this overlay instead of
 * navigating away. No history entries are pushed — see `overlay-history.ts`.
 */
export function useOverlayHistory(isExpanded: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isExpanded) return;
    const handler = () => onCloseRef.current();
    registerCloseHandler(handler);
    return () => unregisterCloseHandler(handler);
  }, [isExpanded]);
}
