// OAuth redirect-error marker. The Telegram (generic OAuth2) flow leaves the SPA
// entirely and comes back through a server 302 — the only channel that survives
// that round-trip in every browser context is the URL itself.
//
// Only the ERROR leg needs a marker. The success leg brings the session home as
// a cookie the browser attaches on its own, so bootstrap() just asks the server
// like on any other boot.
//
//  - `?authError=<provider>` — set on `errorCallbackURL` by signInWithOAuth.
//    better-auth appends its own `?error=<code>` both here and on the bare
//    FRONTEND_ORIGIN redirect from onAPIError (issuer_missing и т.п.), so a lone
//    `error` param without our marker is also an OAuth failure today — the email
//    flow that could produce one is disabled (2026-07-13).
//
// The consumer strips its params via history.replaceState so a stale error can't
// re-show the banner on every boot.

export const OAUTH_ERROR_PARAM = 'authError';

function stripParams(url: URL, params: string[]): void {
  for (const p of params) url.searchParams.delete(p);
  window.history.replaceState(window.history.state, '', url);
}

/**
 * Non-null when the error leg brought the user back (`?authError=` marker
 * and/or a better-auth `?error=<code>`). Strips both params; `code` is
 * better-auth's machine code when present (state_mismatch, issuer_missing, …).
 */
export function consumeOAuthReturnError(): { code: string | null } | null {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const code = url.searchParams.get('error');
  if (code === null && !url.searchParams.has(OAUTH_ERROR_PARAM)) return null;
  stripParams(url, ['error', OAUTH_ERROR_PARAM]);
  return { code };
}
