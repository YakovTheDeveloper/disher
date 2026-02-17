import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export type NavigationDirection = 'forward' | 'back';

export const useNavigationDirection = (): NavigationDirection => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const locationKey = location.key;
  const keysRef = useRef<string[]>([]);

  useEffect(() => {
    if (locationKey && !keysRef.current.includes(locationKey)) {
      keysRef.current.push(locationKey);
    }
  }, [locationKey]);

  if (navigationType === 'POP') {
    return 'back';
  }

  if (navigationType === 'PUSH') {
    return 'forward';
  }

  return 'forward';
};
