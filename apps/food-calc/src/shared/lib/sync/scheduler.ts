import { drainPush } from './backupClient';
import { diagLog } from '@/shared/lib/observability/diagLog';

// Push scheduler — Notesnook hot/cold debounce + visibilitychange beacon +
// online listener + 1h interval fallback. Multi-tab coordination via
// navigator.locks so only one tab pushes at a time; the timestamp guard on
// the server response is the second line of defence against in-flight races.
//
// Hot tables (frequent edits — typing into a schedule cell): 100ms.
// Cold tables (occasional edits — creating a product): 30s.
// We don't track per-table debouncers; one global short timer is good enough
// because dirty rows from any table get drained together.

const HOT_DEBOUNCE_MS = 100;
const COLD_DEBOUNCE_MS = 30_000;
const FALLBACK_INTERVAL_MS = 60 * 60 * 1000;

const LOCK_NAME = 'disher-drain';

let timer: ReturnType<typeof setTimeout> | null = null;
let intervalHandle: ReturnType<typeof setInterval> | null = null;
let started = false;
let currentUserId: string | null = null;
// While the user is mid-swipe, a drainPush would compete with the active
// pointer for the main thread (Dexie cursor + JSON.stringify + fetch headers).
// Swipeable flips this flag on pointerdown / pointerup; drains queued during
// drag are coalesced and fired on release.
let dragActive = false;
let pendingDrainAfterDrag = false;

function clearTimer(): void {
  if (timer) { clearTimeout(timer); timer = null; }
}

async function drainNow(): Promise<void> {
  const userId = currentUserId;
  if (!userId) return;
  if (!navigator.onLine) return;

  // navigator.locks: one tab at a time. If another tab is pushing,
  // the callback waits — short pushes complete quickly.
  await navigator.locks.request(LOCK_NAME, { mode: 'exclusive' }, async () => {
    try {
      const r = await drainPush(userId);
      if (r.accepted || r.rejected) {
        diagLog('[sync] drain', { accepted: r.accepted, rejected: r.rejected });
      }
    } catch (err) {
      diagLog('[sync] drain failed', { err: String(err) });
    }
  });
}

export function scheduleHot(): void {
  if (!started) return;
  if (dragActive) { pendingDrainAfterDrag = true; return; }
  clearTimer();
  timer = setTimeout(drainNow, HOT_DEBOUNCE_MS);
}

export function scheduleCold(): void {
  if (!started) return;
  if (dragActive) { pendingDrainAfterDrag = true; return; }
  clearTimer();
  timer = setTimeout(drainNow, COLD_DEBOUNCE_MS);
}

// Called by Swipeable on pointerdown/pointerup. While dragging, drains are
// suppressed and coalesced; on release we fire one hot drain.
export function setDragActive(active: boolean): void {
  if (active === dragActive) return;
  dragActive = active;
  if (!active && pendingDrainAfterDrag) {
    pendingDrainAfterDrag = false;
    if (started) {
      clearTimer();
      timer = setTimeout(drainNow, HOT_DEBOUNCE_MS);
    }
  }
}

function onVisibility(): void {
  if (document.visibilityState === 'visible') {
    void drainNow();
  }
  // hidden → sendBeacon path is intentionally NOT here; sendBeacon needs the
  // payload synchronously and that's hard to do correctly with Dexie reads.
  // We rely on the next drainNow() when the tab returns. iOS PWA users who
  // home-button repeatedly within 100ms should be a separate followup.
}

function onOnline(): void {
  void drainNow();
}

export function startScheduler(userId: string): void {
  if (started) return;
  started = true;
  currentUserId = userId;

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('online', onOnline);
  intervalHandle = setInterval(drainNow, FALLBACK_INTERVAL_MS);

  // Kick a drain on boot in case there are leftover dirty rows.
  void drainNow();
}

export function stopScheduler(): void {
  if (!started) return;
  started = false;
  currentUserId = null;
  clearTimer();
  if (intervalHandle) { clearInterval(intervalHandle); intervalHandle = null; }
  document.removeEventListener('visibilitychange', onVisibility);
  window.removeEventListener('online', onOnline);
}

export const __test = { drainNow };
