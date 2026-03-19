import { createContext, useContext, useEffect } from 'react';

export type SwipeableLockContextValue = {
  lock: () => void;
  unlock: () => void;
};

export const SwipeableLockContext = createContext<SwipeableLockContextValue>({
  lock: () => {},
  unlock: () => {},
});

export function useSwipeableLock(isLocked: boolean) {
  const { lock, unlock } = useContext(SwipeableLockContext);
  useEffect(() => {
    if (isLocked) {
      lock();
      return () => unlock();
    }
  }, [isLocked, lock, unlock]);
}
