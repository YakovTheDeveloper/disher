import { useEffect, useState, type ReactNode } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient } from '@/shared/lib/storage/queryClient';
import { persister, APP_VERSION } from '@/shared/lib/storage/persister';
import { primePendingCache, drain } from '@/shared/lib/storage/pendingWrites';
import { useAuthStore } from '@/features/auth/auth-store';
import { Sentry } from '@/shared/lib/observability/sentry';

type Props = { children: ReactNode };

export function SyncProvider({ children }: Props) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 7 * 24 * 60 * 60_000,
        buster: APP_VERSION,
      }}
    >
      <SyncBootstrap />
      {children}
    </PersistQueryClientProvider>
  );
}

function SyncBootstrap() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [error, setError] = useState<Error | null>(null);

  // Resolve the initial session once at mount. Authentication is required —
  // no anonymous fallback. AuthGate handles the unauthenticated UI.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await useAuthStore.getState().bootstrap();
      } catch (e) {
        if (!cancelled) {
          Sentry.captureException(e, { tags: { phase: 'auth-bootstrap' }, level: 'fatal' });
          setError(e as Error);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Prime the outbox + drain whenever a real session is active. Re-runs after
  // sign-in (the store flips isLoggedIn → true) so a fresh login picks up
  // any writes the user queued before the network round-trip.
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    (async () => {
      try {
        await primePendingCache();
        if (cancelled) return;
        void drain();
      } catch (e) {
        if (!cancelled) {
          Sentry.captureException(e, { tags: { phase: 'sync-bootstrap' }, level: 'fatal' });
          setError(e as Error);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  // Re-drain on connectivity / visibility transitions while signed in.
  useEffect(() => {
    if (!isLoggedIn) return;
    const onOnline = () => void drain();
    const onVisible = () => {
      if (!document.hidden) void drain();
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isLoggedIn]);

  if (error) {
    return (
      <div style={{ padding: 24, color: 'red' }}>
        Failed to initialize sync: {error.message}
      </div>
    );
  }

  return null;
}
