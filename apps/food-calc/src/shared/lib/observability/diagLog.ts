// Diagnostic log — captures boot/persister/sync events into a ring buffer.
// Entries are auto-shipped to the backend (POST /api/diag-logs) every 2s and
// on pagehide via sendBeacon, so no manual user action is needed to capture
// iOS-only bugs. The DiagButton can still copy to clipboard for ad-hoc grabs.
//
// Use diagLog('[tag] message', { ...fields }) instead of console.warn for
// anything you want included in the dump.

type DiagEntry = {
  t: number;        // ms since boot
  ts: string;       // ISO timestamp
  msg: string;
  data?: unknown;
};

const MAX_ENTRIES = 500;
const buffer: DiagEntry[] = [];
const bootMs = performance.now();
const listeners = new Set<() => void>();

// Random per-boot session id so the backend groups entries from the same
// reload together. Crypto.randomUUID is available on all targets we care about.
const SESSION_ID =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);

const FLUSH_INTERVAL_MS = 2000;
// Same-origin path: the /api/diag-logs proxy to backend :3100 sidesteps iOS
// Safari's per-port self-signed cert prompt. That proxy only exists when
// VITE_DIAG=1 (otherwise it would force the dev server to HTTP/1.1 — see
// vite.config.ts). So flushing is gated on the same flag: without VITE_DIAG
// the proxy is absent and a POST here would just 404. Prod never flushes.
const FLUSH_URL = '/api/diag-logs/';
const FLUSH_ENABLED = import.meta.env.DEV && import.meta.env.VITE_DIAG === '1';

// Index of the next entry that has not been shipped yet. We ship slices to
// the backend so it accumulates the full timeline across many flushes.
let unsentFromIdx = 0;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushInFlight = false;

function scheduleFlush() {
  if (!FLUSH_ENABLED) return;
  if (flushTimer != null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushDiag();
  }, FLUSH_INTERVAL_MS);
}

async function flushDiag(): Promise<void> {
  if (flushInFlight) return;
  if (unsentFromIdx >= buffer.length) return;
  const slice = buffer.slice(unsentFromIdx);
  const startIdxAtSend = unsentFromIdx;
  flushInFlight = true;
  try {
    const body = JSON.stringify({
      sessionId: SESSION_ID,
      entries: slice,
      ua: navigator.userAgent,
      pwa: getPwaTag(),
      online: navigator.onLine,
    });
    const res = await fetch(FLUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });
    if (res.ok) {
      // Only advance the cursor on success. On failure we'll resend the same
      // slice next time (idempotent on the backend — duplicate dumps OK).
      // Account for ring-buffer trimming: if MAX_ENTRIES kicked in between
      // send and ack, buffer.length may have grown but the start moved.
      const sentCount = slice.length;
      const trimmed = startIdxAtSend; // entries before send still in buffer
      unsentFromIdx = Math.min(trimmed + sentCount, buffer.length);
    }
  } catch {
    // Network failure — try again next interval.
  } finally {
    flushInFlight = false;
    if (unsentFromIdx < buffer.length) scheduleFlush();
  }
}

function flushDiagBeacon(): void {
  if (!FLUSH_ENABLED) return;
  if (unsentFromIdx >= buffer.length) return;
  const slice = buffer.slice(unsentFromIdx);
  const body = JSON.stringify({
    sessionId: SESSION_ID,
    entries: slice,
    ua: navigator.userAgent,
    pwa: getPwaTag(),
    online: navigator.onLine,
    reason: 'beacon',
  });
  try {
    if (navigator.sendBeacon) {
      // sendBeacon needs a Blob with the right content-type.
      const blob = new Blob([body], { type: 'application/json' });
      const ok = navigator.sendBeacon(FLUSH_URL, blob);
      if (ok) unsentFromIdx = buffer.length;
    }
  } catch {
    // Best effort.
  }
}

function getPwaTag(): string {
  const standalone = (navigator as unknown as { standalone?: boolean }).standalone;
  const displayMode =
    typeof matchMedia === 'function' ? matchMedia('(display-mode: standalone)').matches : undefined;
  return `standalone=${standalone ?? 'n/a'} display-mode=${displayMode ?? 'n/a'}`;
}

if (typeof window !== 'undefined') {
  // Critical moments to drain the buffer before the page disappears.
  window.addEventListener('pagehide', flushDiagBeacon);
  window.addEventListener('beforeunload', flushDiagBeacon);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushDiagBeacon();
  });
}

export function diagLog(msg: string, data?: unknown): void {
  const entry: DiagEntry = {
    t: Math.round(performance.now() - bootMs),
    ts: new Date().toISOString(),
    msg,
    data,
  };
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) {
    buffer.shift();
    if (unsentFromIdx > 0) unsentFromIdx -= 1;
  }
  // Mirror to console.warn so vConsole still shows it live.
  console.warn(msg, data ?? '');
  for (const l of listeners) l();
  scheduleFlush();
}
