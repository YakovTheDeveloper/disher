import { useEffect, useState, type ReactNode } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient } from '@/shared/lib/storage/queryClient';
import { persister, APP_VERSION } from '@/shared/lib/storage/persister';
import { primePendingCache, drain } from '@/shared/lib/storage/pendingWrites';
import { supabase } from '@/shared/api/supabase-client';

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
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 1. getSession первым: gotrue-js под внутренним lock'ом сделает refresh,
        //    предотвращая race "Already Used refresh token" между boot drain и первым useQuery.
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;

        if (!session) {
          const { error: anonErr } = await supabase.auth.signInAnonymously();
          if (anonErr) throw anonErr;
        }
        if (cancelled) return;

        // 2. Дроп записей со старой APP_VERSION (schema drift).
        await primePendingCache();
        if (cancelled) return;

        // 3. Drain очереди.
        void drain();
      } catch (e) {
        if (!cancelled) setError(e as Error);
      }
    })();

    const onOnline = () => void drain();
    const onVisible = () => {
      if (!document.hidden) void drain();
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (error) {
    return (
      <div style={{ padding: 24, color: 'red' }}>
        Failed to initialize sync: {error.message}
      </div>
    );
  }

  return null;
}
