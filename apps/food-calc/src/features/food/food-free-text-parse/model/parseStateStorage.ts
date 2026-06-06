import type { ParseResponse } from '../api/parseFreeTextFood';
import { getStorageKey, type ParseTarget } from './target';

export type PersistedStatus = 'loading' | 'ready' | 'error';

// Which front-end produced this parse — picks the fetcher on a reload-during-
// loading restore. 'text' = user typed (free-text-food/parse), 'dishName' =
// semantic "infer recipe" button (suggestions/dish-products). Optional for
// backward compat with states persisted before this field existed (→ 'text').
export type ParseIntake = 'text' | 'dishName';

export interface PersistedParseState {
  target: ParseTarget;
  status: PersistedStatus;
  inputText: string;
  parseResult?: ParseResponse;
  errorMessage?: string;
  startedAt: number;
  requestId: string;
  intake?: ParseIntake;
}

function storageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
  } catch {
    return false;
  }
}

function isSameTarget(a: ParseTarget, b: ParseTarget): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'schedule' && b.kind === 'schedule') return a.date === b.date;
  if (a.kind === 'dish' && b.kind === 'dish') return a.dishId === b.dishId;
  return false;
}

function isPersistedParseState(
  value: unknown,
  target: ParseTarget,
): value is PersistedParseState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<PersistedParseState>;
  if (!v.target || !isSameTarget(v.target, target)) return false;
  if (v.status !== 'loading' && v.status !== 'ready' && v.status !== 'error') return false;
  if (typeof v.inputText !== 'string') return false;
  if (typeof v.startedAt !== 'number') return false;
  if (typeof v.requestId !== 'string') return false;
  return true;
}

export function readParseState(target: ParseTarget): PersistedParseState | null {
  if (!storageAvailable()) return null;
  try {
    const raw = window.sessionStorage.getItem(getStorageKey(target));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isPersistedParseState(parsed, target)) {
      window.sessionStorage.removeItem(getStorageKey(target));
      return null;
    }
    return parsed;
  } catch {
    try {
      window.sessionStorage.removeItem(getStorageKey(target));
    } catch {
      // ignore
    }
    return null;
  }
}

export function writeParseState(state: PersistedParseState): void {
  if (!storageAvailable()) return;
  try {
    window.sessionStorage.setItem(getStorageKey(state.target), JSON.stringify(state));
  } catch {
    // ignore quota/errors; state is best-effort
  }
}

export function clearParseState(target: ParseTarget): void {
  if (!storageAvailable()) return;
  try {
    window.sessionStorage.removeItem(getStorageKey(target));
  } catch {
    // ignore
  }
}
