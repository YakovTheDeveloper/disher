import { useEffect, useRef } from 'react';
import {
  pushOverlayEntry,
  popOverlayEntry,
  registerCloseHandler,
  unregisterCloseHandler,
  isPopstateClosing,
} from './overlay-history';

/**
 * Pushes a sentinel history entry while `isExpanded` is true,
 * so that browser Back calls `onClose` instead of navigating away.
 */
export function useOverlayHistory(isExpanded: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isExpanded) {
      const handler = () => onCloseRef.current();
      handlerRef.current = handler;
      pushOverlayEntry();
      registerCloseHandler(handler);

      return () => {
        unregisterCloseHandler(handler);
        handlerRef.current = null;
        if (!isPopstateClosing()) {
          popOverlayEntry();
        }
      };
    }
  }, [isExpanded]);
}
