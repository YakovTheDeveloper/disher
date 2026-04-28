import type { ReactNode } from 'react';
import { useAuthStore } from './auth-store';
import { AuthScreen } from './AuthScreen';

type Props = { children: ReactNode };

/**
 * Authentication blocker. While the initial session check is in flight we
 * render nothing (FOUC is hidden by the root .ready class in app/index).
 * After bootstrap, if there is no signed-in user we render AuthScreen instead
 * of the app — and a successful sign-in flips isLoggedIn, which unmounts the
 * gate and reveals children.
 */
export function AuthGate({ children }: Props) {
  const isReady = useAuthStore((s) => s.isReady);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  if (!isReady) return null;
  if (!isLoggedIn) return <AuthScreen />;
  return <>{children}</>;
}
