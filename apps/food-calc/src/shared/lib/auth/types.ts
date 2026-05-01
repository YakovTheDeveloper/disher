// Auth contract for the app — provider-agnostic types that the rest of the
// codebase consumes. Concrete implementations (currently betterAuthProvider)
// map vendor SDK types onto these.

import type { ErrorKind } from '@/shared/lib/errors/classify';

export type AppUser = {
  id: string;
  email: string | null;
};

// Provider-neutral auth error shape. Reuses the project-wide ErrorKind so
// callers can pattern-match on `.kind` and surface the right toast.
// Provider-specific codes (`invalid_credentials`, `email_not_confirmed`, …)
// flow through `code` on the auth/validation kinds.
export type AuthError = ErrorKind;

export type AuthResult =
  | { ok: true; user: AppUser }
  | { ok: false; error: AuthError };

// AuthChangeEvent is intentionally a small superset of supabase's events —
// only the ones the app reacts to. New providers must map onto this set.
export type AuthChangeEvent =
  | 'signed_in'
  | 'signed_out'
  | 'token_refreshed'
  | 'user_updated';

export interface AuthProvider {
  /**
   * Resolve the initial session from local storage. Returns the user if a
   * valid session is present, null otherwise. Does NOT throw on
   * "no session" — only on storage / parse errors.
   */
  bootstrap(): Promise<AppUser | null>;

  /**
   * Current access token (JWT) if signed in, null otherwise. Implementations
   * are expected to refresh transparently when close to expiry.
   */
  getAccessToken(): Promise<string | null>;

  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;

  /**
   * Subscribe to session changes (sign-in/out, token refresh, user update).
   * Returns an unsubscribe function.
   */
  onAuthChange(cb: (event: AuthChangeEvent, user: AppUser | null) => void): () => void;

  /** Synchronous read of the cached current user (no IO). */
  getCurrentUser(): AppUser | null;
}
