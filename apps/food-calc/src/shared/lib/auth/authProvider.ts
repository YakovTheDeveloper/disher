// Single switch point for the active auth provider. The rest of the app
// imports `authProvider` from here. Phase 1 of the supabase migration plan
// flipped this from supabaseAuthProvider to betterAuthProvider; the supabase
// implementation is kept around until B4 finalises the removal.
import { betterAuthProvider } from './betterAuthProvider';
import type { AuthProvider } from './types';

export const authProvider: AuthProvider = betterAuthProvider;

export type { AppUser, AuthError, AuthResult, AuthChangeEvent, AuthProvider } from './types';
