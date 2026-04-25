import { PowerSyncContext } from '@powersync/react';
import { useEffect, useState, type ReactNode } from 'react';

import { SupabaseConnector } from './connector';
import { db } from './database';
import { supabase } from './supabase-client';

const connector = new SupabaseConnector();

type Props = { children: ReactNode };

export function PowerSyncProvider({ children }: Props) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await db.init();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const { error: anonErr } = await supabase.auth.signInAnonymously();
          if (anonErr) throw anonErr;
        }

        await db.connect(connector);
        if (!cancelled) setReady(true);
      } catch (err) {
        console.error('PowerSync bootstrap failed', err);
        if (!cancelled) setError(err as Error);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // Force PowerSync to pick up the new access token without re-syncing.
        connector.fetchCredentials().catch((e) =>
          console.error('refresh fetchCredentials failed', e)
        );
      }
      if (event === 'SIGNED_OUT') {
        db.disconnectAndClear().catch((e) =>
          console.error('disconnectAndClear failed', e)
        );
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (error) {
    return (
      <div style={{ padding: 24, color: 'red' }}>
        Failed to initialize sync: {error.message}
      </div>
    );
  }

  if (!ready) {
    return null;
  }

  return (
    <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>
  );
}
