// OAuth redirect-return markers. The Telegram (generic OAuth2) flow leaves the
// SPA entirely and comes back through a server 302 — the only channel that
// survives that round-trip in every browser context is the URL itself. Two
// markers, two consumers:
//
//  - `?oauth=<provider>` — success leg, set on `callbackURL` by
//    signInWithOAuth. bootstrap() sees it and captures the freshly minted
//    cookie-session into the bearer slot (the `set-auth-token` header rides
//    the 302 and is invisible to JS, so localStorage has no bearer yet).
//  - `?authError=<provider>` — error leg, set on `errorCallbackURL`.
//    better-auth appends its own `?error=<code>` both here and on the bare
//    FRONTEND_ORIGIN redirect from onAPIError (issuer_missing и т.п.), so a
//    lone `error` param without our marker is also an OAuth failure today —
//    the email flow that could produce one is disabled (2026-07-13).
//
// Each consumer strips its params via history.replaceState so a marker never
// survives a reload: a stale `oauth` flag would re-run the session capture, a
// stale error would re-show the banner on every boot.

export const OAUTH_RETURN_PARAM = 'oauth';
export const OAUTH_ERROR_PARAM = 'authError';

function stripParams(url: URL, params: string[]): void {
  for (const p of params) url.searchParams.delete(p);
  window.history.replaceState(window.history.state, '', url);
}

/** True when the success marker is present. Strips it from the address bar. */
export function consumeOAuthReturnFlag(): boolean {
  if (typeof window === 'undefined') return false;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(OAUTH_RETURN_PARAM)) return false;
  stripParams(url, [OAUTH_RETURN_PARAM]);
  return true;
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
