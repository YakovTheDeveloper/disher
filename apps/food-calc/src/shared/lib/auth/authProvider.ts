// Single switch point for the active auth provider. The rest of the app
// imports `authProvider` from here.
import { betterAuthProvider } from './betterAuthProvider';
import type { AuthProvider } from './types';

export const authProvider: AuthProvider = betterAuthProvider;

export type { AppUser, AuthError, AuthResult, AuthChangeEvent, AuthProvider } from './types';
