// Single switch point for the active auth provider. The rest of the app
// imports `authProvider` from here — when Phase 1 of the migration plan
// runs, only this file changes (swap supabaseAuthProvider for
// customAuthProvider).
import { supabaseAuthProvider } from './supabaseAuthProvider';
import type { AuthProvider } from './types';

export const authProvider: AuthProvider = supabaseAuthProvider;

export type { AppUser, AuthError, AuthResult, AuthChangeEvent, AuthProvider } from './types';
