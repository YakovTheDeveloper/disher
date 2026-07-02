import { logMutationError } from '@/shared/lib/mutationLog';
import { classifyError, type ErrorKind } from '@/shared/lib/errors/classify';
import { Sentry } from '@/shared/lib/observability/sentry';

// Central error reporter. Extracted from safeMutate so BOTH the mutation wrapper
// and the fire-and-forget paths (sync-status store, render boundaries, the
// global unhandledrejection bridge) share ONE report pipeline:
//   classify → console → mutationLog (localStorage ring) → Sentry (tagged)
// and hand back a short `refId` — a support-correlation id the UI can show next
// to a failure ("код: a1b2c3d4") so a user report maps to a Sentry event.
// The refId is a human-readable reference, NOT a security token.

export interface ReportedError {
  kind: ErrorKind;
  /** Short support-correlation id (8 hex chars). Also set as a Sentry tag. */
  refId: string;
}

function makeRefId(): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  return uuid.replace(/-/g, '').slice(0, 8);
}

/**
 * Report an error once through the shared pipeline and return `{ kind, refId }`.
 * Pass a pre-classified `kind` to avoid re-classifying (callers that already
 * hold one). `op` is a short operation label used as the mutationLog op + Sentry
 * `op` tag (e.g. `'sync'`, `'render'`, `'unhandledrejection'`).
 */
export function reportError(
  op: string,
  error: unknown,
  kind: ErrorKind = classifyError(error),
): ReportedError {
  const refId = makeRefId();

  console.error('[error]', { op, kind: kind.kind, refId, error });

  logMutationError(op, error, kind);

  Sentry.captureException(error, {
    tags: {
      kind: kind.kind,
      op,
      refId,
      ...('status' in kind && kind.status !== undefined ? { status: String(kind.status) } : {}),
      ...('code' in kind && kind.code ? { code: kind.code } : {}),
    },
  });

  return { kind, refId };
}
