// INVARIANT — "no silent failures": every data-affecting async operation must
// end with a visible signal (toaster / banner / inline field error) if it
// fails. A swallowing `.catch(() => {})` is allowed ONLY on a best-effort path
// that cannot lose user data, and it MUST carry a `// best-effort: <why no data
// loss>` annotation + an `// eslint-disable-next-line no-restricted-syntax`
// (an ESLint rule bans the un-annotated form — see eslint.config.ts). This
// module (`safeMutate`) is the load-bearing enforcer for user-triggered
// mutations; fire-and-forget/background async is covered by the sync-status
// store, the global unhandledrejection bridge, and per-feature toasters.
import toaster from '@/shared/lib/toaster/toaster';
import { defaultUserMessage } from '@/shared/lib/errors/classify';
import { reportError } from '@/shared/lib/errors/report';

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
    const { kind } = reportError(errorMessage, error);

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
