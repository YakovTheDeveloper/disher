import { useSyncExternalStore } from 'react';
import { getHours, getMinutes } from 'date-fns';

const formatTime = (date: Date): string =>
  `${String(getHours(date)).padStart(2, '0')}:${String(getMinutes(date)).padStart(2, '0')}`;

let currentTime = formatTime(new Date());
const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  if (!intervalId) {
    intervalId = setInterval(() => {
      const next = formatTime(new Date());
      if (next !== currentTime) {
        currentTime = next;
        listeners.forEach(l => l());
      }
    }, 30_000);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
};

const getSnapshot = () => currentTime;

export const useNow = (): string =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const formatNow = formatTime;
