// better-auth client for the SPA. Bearer-token mode (no httpOnly cookie):
// the server-side `bearer()` plugin returns the session token in the
// `set-auth-token` response header on sign-in / sign-up; we capture it in
// `onSuccess`, persist to localStorage, and `fetchOptions.auth.token` reads
// it back to attach `Authorization: Bearer <token>` on subsequent calls.
//
// Sessions are opaque server-side, NOT JWTs — there is no client-side refresh,
// and a 401 means "sign out" (handled by betterAuthProvider). The server sets
// `expiresIn` to 365 days with a sliding `updateAge` of 1 day (see
// apps/disher-backend-3.0/src/auth/server.ts) — NOT the ~7 days this comment
// used to claim. That long lifetime is why an offline signOut whose server
// revoke never lands leaves the token valid for up to a year: the "the server
// session expires on its own" assurance in betterAuthProvider.signOut leans on
// this value, so keep the two in sync (a leaked bearer's lifetime = this).

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
