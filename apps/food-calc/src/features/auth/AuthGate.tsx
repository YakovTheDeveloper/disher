import type { ReactNode } from 'react';
import { useAuthStore } from './auth-store';
import { AuthScreen } from './AuthScreen';

type Props = { children: ReactNode };

// Public routes that must render even when there is no session — they ARE
// the auth flow (verify-email click in the inbox, future password-reset, etc).
// Keep them anchored under /auth/ so the prefix check stays trivial.
const PUBLIC_PATH_PREFIXES = ['/auth/'] as const;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Authentication blocker. While the initial session check is in flight we
 * render nothing (FOUC is hidden by the root .ready class in app/index).
 * After bootstrap, if there is no signed-in user we render AuthScreen instead
 * of the app — and a successful sign-in flips isLoggedIn, which unmounts the
 * gate and reveals children.
 *
 * Exception: routes under /auth/ (e.g. /auth/verify-email) bypass the gate so
 * unauthenticated users arriving from a verification email can complete the
 * flow. The verify-email page calls authClient.verifyEmail itself, which
 * triggers the auth-store onAuthChange subscription → isLoggedIn flips → next
 * navigation lands on the gated app.
 *
 * Do NOT short-circuit this to `<>{children}</>` to test without a login: the
 * app then boots signed-out, no bearer is ever minted, and every authedFetch
 * (sync, analyze, free-text-food) throws NotAuthenticatedError BEFORE issuing a
 * request — the user sees a bare «Что-то пошло не так» and no network activity
 * at all. That shipped to prod once (98d3f1b3 → 7b2f54e4); use a real test
 * account instead.
 *
 * NB: we read `window.location.pathname` directly. AuthGate is mounted inside
 * App's Outlet so a Router context is available, but the public-path check is
 * only meaningful on initial render — the auth-store state flip handles the
 * "after verify-email" transition without needing reactive pathname tracking.
 */
export function AuthGate({ children }: Props) {
  const isReady = useAuthStore((s) => s.isReady);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

  if (isPublicPath(pathname)) return <>{children}</>;
  if (!isReady) return null;
  if (!isLoggedIn) return <AuthScreen />;
  return <>{children}</>;
}
