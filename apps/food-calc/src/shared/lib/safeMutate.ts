import toaster from '@/shared/lib/toaster/toaster';
import { logMutationError } from '@/shared/lib/mutationLog';
import { classifyError, defaultUserMessage } from '@/shared/lib/errors/classify';
import { Sentry } from '@/shared/lib/observability/sentry';

export type SafeMutateResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: unknown };

/**
 * Wraps a mutation function. On throw:
 *  1. classifies the error into a discriminated `ErrorKind`
 *  2. writes a structured entry to mutationLog (`{op, kind, status, code, err}`)
 *  3. shows a kind-aware toaster (dev: `[kind status code] msg — raw`, prod: localized)
 *  4. reports to Sentry with `kind`, `code`, `op` tags
 *
 * Returns a discriminated `{ ok, value | error }` so callers can distinguish
 * success from failure even when the wrapped function returns `void`.
 */
export async function safeMutate<T>(
  fn: () => T | Promise<T>,
  errorMessage = 'Не удалось сохранить',
): Promise<SafeMutateResult<T>> {
  try {
    const value = await fn();
    return { ok: true, value };
  } catch (error) {
    const kind = classifyError(error);
    console.error('[mutation error]', { op: errorMessage, kind: kind.kind, error });

    logMutationError(errorMessage, error, kind);

    Sentry.captureException(error, {
      tags: {
        kind: kind.kind,
        op: errorMessage,
        ...('status' in kind && kind.status !== undefined ? { status: String(kind.status) } : {}),
        ...('code' in kind && kind.code ? { code: kind.code } : {}),
      },
    });

    // Caller passed a generic «Не удалось сохранить» style fallback — let the
    // classifier produce a kind-specific message instead. If the caller passed
    // a domain-specific message, keep it as the prod text but still show the
    // dev `[kind ...]` prefix so the cause is visible.
    const userMsg =
      errorMessage === 'Не удалось сохранить'
        ? defaultUserMessage(kind)
        : import.meta.env.DEV
          ? `${defaultUserMessage(kind)} | ${errorMessage}`
          : errorMessage;

    toaster.error(userMsg, { kind });
    return { ok: false, error };
  }
}
