// Thin wrapper over the Supabase auth API surface used by the app. This is
// the ONLY file allowed to import `supabase.auth.*` in the auth boundary;
// everything else goes through `authProvider` (which sits on top of this).
//
// The wrapper exists for two reasons:
// 1. CLAUDE.md fixes "only authClient may import @supabase/supabase-js for
//    auth" as a project rule — this file is what the rule talks about.
// 2. It pins the auth API contract so swapping vendors is one-file work
//    (better-auth, custom JWT, …) — see plans/supabase-to-own-solution-migration.md.

import { supabase } from '@/shared/api/supabase-client';
import type {
  Session,
  User,
  AuthError as SupabaseAuthError,
  AuthChangeEvent as SupabaseAuthChangeEvent,
} from '@supabase/supabase-js';

export type SignInResult = { data: { user: User | null; session: Session | null }; error: SupabaseAuthError | null };
export type SignUpResult = { data: { user: User | null; session: Session | null }; error: SupabaseAuthError | null };

export const authClient = {
  getSession: () => supabase.auth.getSession(),

  signInWithPassword: (email: string, password: string): Promise<SignInResult> =>
    supabase.auth.signInWithPassword({ email, password }),

  signUp: (email: string, password: string): Promise<SignUpResult> =>
    supabase.auth.signUp({ email, password }),

  // scope:'local' clears tokens locally without calling /auth/v1/logout —
  // logout API can fail (network/403/etc) and would otherwise leave the
  // store stuck `isLoggedIn: true` while local data is already wiped.
  // Refresh token expiry on the server makes the orphaned session
  // self-extinguishing within hours.
  signOut: () => supabase.auth.signOut({ scope: 'local' }),

  refreshSession: () => supabase.auth.refreshSession(),

  onAuthStateChange: (cb: (event: SupabaseAuthChangeEvent, session: Session | null) => void) =>
    supabase.auth.onAuthStateChange(cb),
};
