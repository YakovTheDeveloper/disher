// better-auth client for the SPA. Cookie mode — the server sets an httpOnly
// session cookie (see apps/disher-backend-3.0/src/auth/server.ts) and the
// browser attaches it to every call. `credentials: 'include'` is what makes
// that happen across origins: the SPA (disher.life) and the API
// (api.disher.life) are different origins of the SAME site, so the cookie is
// first-party — SameSite=Lax carries it and Safari's ITP does not cap it.
//
// Nothing about the session is readable from JS by design: an XSS can no longer
// walk off with the token. The tradeoff is that "am I signed in?" cannot be
// answered without a round-trip — hence `disher.lastUser` in betterAuthProvider,
// which exists purely for optimistic render on boot.
//
// Sessions are opaque server-side, NOT JWTs — there is no client-side refresh,
// and a 401 means "sign out" (handled by betterAuthProvider). The server sets
// `expiresIn` to 365 days with a sliding `updateAge` of 1 day.

import { createAuthClient } from 'better-auth/react';
import { genericOAuthClient } from 'better-auth/client/plugins';
import { API_BASE } from '@/shared/lib/api/base';

export const authClient = createAuthClient({
  baseURL: `${API_BASE}/api/auth`,
  // genericOAuthClient adds `authClient.signIn.oauth2(...)`, used for Telegram
  // OIDC login (see shared/lib/auth/betterAuthProvider.signInWithOAuth). The
  // server only mounts the provider when TELEGRAM_CLIENT_* are set.
  plugins: [genericOAuthClient()],
  fetchOptions: {
    credentials: 'include',
  },
});
