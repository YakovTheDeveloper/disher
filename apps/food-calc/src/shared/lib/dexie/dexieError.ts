import toaster from '@/shared/lib/toaster/toaster';

// Dexie/IndexedDB failure classifier. The write contract (write.ts) is the
// single sanctioned mutation path, so it is the one place we can reliably catch
// a storage-layer reject and turn it into a user-visible signal instead of a
// silent data loss (tier-3 failure). Two failures matter to the user:
//   • quota exceeded   — the device is full; the write did NOT land.
//   • open failure     — the local DB can't be opened (Safari Private mode,
//                        corruption, another tab holding a version lock).
// Everything else re-throws untouched (safeMutate above already toasts generic
// mutation errors — double-toasting would be noise).

export type DexieErrorKind = 'quota' | 'open_failure' | 'other';

export interface ClassifiedDexieError {
  kind: DexieErrorKind;
  /** Localized RU message, ready for toaster.error. Empty for `'other'`. */
  message: string;
  raw: unknown;
}

// Dexie wraps the underlying DOMException, exposing its name on the error and
// (for wrapped causes) on `.inner`. Walk both so a wrapped QuotaExceededError is
// still recognised.
function errorNames(err: unknown): string[] {
  const names: string[] = [];
  const e = err as { name?: unknown; inner?: { name?: unknown } } | null;
  if (e && typeof e.name === 'string') names.push(e.name);
  if (e && e.inner && typeof e.inner.name === 'string') names.push(e.inner.name);
  return names;
}

const OPEN_FAILURE_NAMES = new Set([
  'InvalidStateError', // Safari Private mode — IDB open blocked
  'VersionError',
  'DatabaseClosedError',
  'UnknownError', // corruption / disk I/O
  'NotFoundError',
]);

export function classifyDexieError(err: unknown): ClassifiedDexieError {
  const names = errorNames(err);
  if (names.includes('QuotaExceededError')) {
    return {
      kind: 'quota',
      message: 'Недостаточно места в хранилище — освободите место и повторите',
      raw: err,
    };
  }
  if (names.some((n) => OPEN_FAILURE_NAMES.has(n))) {
    return {
      kind: 'open_failure',
      message: 'Не удалось открыть локальную базу — перезагрузите страницу',
      raw: err,
    };
  }
  return { kind: 'other', message: '', raw: err };
}

// Optional hook the storage-pressure module registers so a QuotaExceededError
// immediately re-checks `navigator.storage.estimate()` and flips the persistent
// banner — without dexieError importing the store (avoids a cycle).
let onQuotaExceeded: (() => void) | null = null;
export function setQuotaExceededHandler(fn: (() => void) | null): void {
  onQuotaExceeded = fn;
}

/**
 * Classify a Dexie reject at the write-contract boundary and, for the two
 * user-relevant storage failures, show a toaster. Returns the classification so
 * the caller can decide to re-throw (it must, to keep tx rollback intact).
 * A `'quota'` failure also trips the storage-pressure re-check.
 */
export function surfaceDexieError(err: unknown): ClassifiedDexieError {
  const classified = classifyDexieError(err);
  if (classified.kind !== 'other') {
    toaster.error(classified.message);
  }
  if (classified.kind === 'quota') onQuotaExceeded?.();
  return classified;
}
