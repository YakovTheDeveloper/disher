// Auth contract for the app — provider-agnostic types that the rest of the
// codebase consumes. Concrete implementations (currently betterAuthProvider)
// map vendor SDK types onto these.

import type { ErrorKind } from '@/shared/lib/errors/classify';

export type AppUser = {
  id: string;
  email: string | null;
  /**
   * Coarse authorization role from the auth provider (better-auth `admin`
   * plugin: 'admin' | 'user' | null). Drives the client-side admin gate ONLY —
   * env-admins carry role 'user' in the DB and are recognized via a server
   * probe (`GET /api/admin/me`), so a null/'user' role is NOT proof of
   * non-admin. Never a security boundary (the server guards every admin route).
   */
  role: string | null;
};

// Provider-neutral auth error shape. Reuses the project-wide ErrorKind so
// callers can pattern-match on `.kind` and surface the right toast.
// Provider-specific codes (`invalid_credentials`, `email_not_confirmed`, …)
// flow through `code` on the auth/validation kinds.
export type AuthError = ErrorKind;

export type AuthResult =
  | { ok: true; user: AppUser }
  | { ok: false; error: AuthError };

// signUp under requireEmailVerification never returns a user — the success
// case is "we sent a verification email, wait for the click". Modeled as a
// distinct result so callers can branch on `pendingVerification` without
// having to handle a `user: null` case in `AuthResult`.
export type SignUpResult =
  | { ok: true; pendingVerification: true; email: string }
  | { ok: false; error: AuthError };

// Provider-agnostic session lifecycle events. `token_refreshed` is included
// for providers that auto-refresh; the better-auth impl never emits it
// (sessions are opaque, no refresh — a 401 means sign-out).
export type AuthChangeEvent =
  | 'signed_in'
  | 'signed_out'
  | 'token_refreshed'
  | 'user_updated';

export interface AuthProvider {
  /**
   * Resolve the initial session against the server (the session cookie is
   * httpOnly — there is nothing local to read). Returns the user if a valid
   * session is present, null otherwise. Does NOT throw on "no session".
   */
  bootstrap(): Promise<AppUser | null>;

  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(email: string, password: string): Promise<SignUpResult>;
  signOut(): Promise<void>;

  /**
   * Start a redirect-based OAuth2/OIDC sign-in (e.g. Telegram). On success the
   * browser navigates away to the provider, so the promise typically does not
   * resolve in-page. A returned `{ ok: false }` means the redirect could not
   * even be started (misconfigured provider / network) — never throws.
   */
  signInWithOAuth(
    providerId: string,
    callbackURL?: string,
  ): Promise<{ ok: false; error: AuthError } | undefined>;

  /**
   * Attach a provider identity (e.g. Telegram) to the ALREADY signed-in user.
   * The only safe way to reach one account from both email and Telegram:
   * Telegram returns no email, so better-auth cannot link by email and a plain
   * `signInWithOAuth` would mint a SECOND user (separate wallet). Same redirect
   * shape as `signInWithOAuth` — the browser navigates away on success.
   */
  linkOAuth(
    providerId: string,
    callbackURL?: string,
  ): Promise<{ ok: false; error: AuthError } | undefined>;

  /**
   * providerIds already attached to the signed-in user ('credential' for the
   * email/password one, 'telegram', …). Returns [] on any failure — callers use
   * it to hide an already-done "link" affordance, never to gate access.
   */
  listLinkedProviders(): Promise<string[]>;

  /**
   * Re-send the email-verification link for an account that signed up but
   * hasn't clicked the link yet. The provider returns `{ ok: true }` even if
   * the address doesn't exist (anti-enumeration); only network/validation
   * failures surface as `ok: false`.
   */
  sendVerificationEmail(email: string): Promise<{ ok: true } | { ok: false; error: AuthError }>;

  /**
   * Subscribe to session changes (sign-in/out, token refresh, user update).
   * Returns an unsubscribe function.
   */
  onAuthChange(cb: (event: AuthChangeEvent, user: AppUser | null) => void): () => void;

  /** Synchronous read of the cached current user (no IO). */
  getCurrentUser(): AppUser | null;
}
