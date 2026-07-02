import toaster from '@/shared/lib/toaster/toaster';
import { classifyError, defaultUserMessage, type ErrorKind } from '@/shared/lib/errors/classify';

// Global safety net for fire-and-forget async errors (promises in event
// handlers, background tasks) that leaked past the addressed toasters. Yaris 3
// of the "three tiers of failure": code threw, UI stayed silent.
//
// INTERACTION WITH SENTRY: Sentry's globalHandlersIntegration ALREADY captures
// `unhandledrejection` / `error` events, so we do NOT re-report here (that would
// double-report). We ONLY add a user-visible toast, and we never call
// preventDefault() so Sentry's own listener still sees the event.

// Kinds worth interrupting the user for. validation/auth are handled at their
// call-sites (AuthForm, safeMutate) — toasting them globally too would double up.
const DEV_KINDS: ReadonlySet<ErrorKind['kind']> = new Set([
  'network',
  'timeout',
  'server',
  'payment_required',
  'rate_limit',
  'unknown',
]);
// In prod, narrow to the genuinely unexpected so transient flaps don't spam.
const PROD_KINDS: ReadonlySet<ErrorKind['kind']> = new Set(['server', 'unknown']);

const DEDUPE_MS = 5000; // suppress the same kind+message for 5s
const GLOBAL_MIN_GAP_MS = 2000; // at most ~1 global toast / 2s (render-loop storms)

let installed = false;
const recent = new Map<string, number>();
let lastToastAt = 0;

function hashMessage(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
}

function shouldToast(kind: ErrorKind, nowMs: number): boolean {
  const allowed = import.meta.env.PROD ? PROD_KINDS : DEV_KINDS;
  if (!allowed.has(kind.kind)) return false;
  if (nowMs - lastToastAt < GLOBAL_MIN_GAP_MS) return false; // global rate cap
  const key = `${kind.kind}:${hashMessage(kind.message || '')}`;
  const prev = recent.get(key);
  if (prev !== undefined && nowMs - prev < DEDUPE_MS) return false; // per-key dedupe
  recent.set(key, nowMs);
  if (recent.size > 50) {
    for (const [k, ts] of recent) if (nowMs - ts > DEDUPE_MS) recent.delete(k);
  }
  return true;
}

/** Classify + throttled-toast a leaked async error. Exported for tests. */
export function handleGlobalError(reason: unknown): void {
  const kind = classifyError(reason);
  const now = Date.now();
  if (!shouldToast(kind, now)) return;
  lastToastAt = now;
  toaster.error(defaultUserMessage(kind), { kind });
}

/** Idempotent. Attaches the window listeners once. */
export function installGlobalErrorHandlers(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('unhandledrejection', (e) => {
    handleGlobalError((e as PromiseRejectionEvent).reason);
  });

  window.addEventListener('error', (e) => {
    const ev = e as ErrorEvent;
    // Resource-load failures (<img>/<script>) surface as an `error` event with
    // no `error` object — skip those; only real thrown Errors get a toast.
    if (!ev.error) return;
    handleGlobalError(ev.error);
  });
}

/** Test hook — clears throttle state + the installed flag. */
export function resetGlobalErrorHandlersForTest(): void {
  installed = false;
  recent.clear();
  lastToastAt = 0;
}
