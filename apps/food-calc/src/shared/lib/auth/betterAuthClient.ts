// better-auth client for the SPA. Bearer-token mode (no httpOnly cookie):
// the server-side `bearer()` plugin returns the session token in the
// `set-auth-token` response header on sign-in / sign-up; we capture it in
// `onSuccess`, persist to localStorage, and `fetchOptions.auth.token` reads
// it back to attach `Authorization: Bearer <token>` on subsequent calls.
//
// Sessions are opaque server-side, NOT JWTs — there is no client-side
// refresh; the token lives ~7 days (better-auth default) and a 401 means
// "sign out" (handled by betterAuthProvider).

import { createAuthClient } from 'better-auth/react';
import { genericOAuthClient } from 'better-auth/client/plugins';
import { API_BASE } from '@/shared/lib/api/base';

export const BEARER_KEY = 'disher.bearer';

export const authClient = createAuthClient({
  baseURL: `${API_BASE}/api/auth`,
  // genericOAuthClient adds `authClient.signIn.oauth2(...)`, used for Telegram
  // OIDC login (see shared/lib/auth/betterAuthProvider.signInWithOAuth). The
  // server only mounts the provider when TELEGRAM_CLIENT_* are set.
  plugins: [genericOAuthClient()],
  fetchOptions: {
    auth: {
      type: 'Bearer',
      token: () => localStorage.getItem(BEARER_KEY) ?? '',
    },
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get('set-auth-token');
      if (token) localStorage.setItem(BEARER_KEY, token);
    },
  },
});
