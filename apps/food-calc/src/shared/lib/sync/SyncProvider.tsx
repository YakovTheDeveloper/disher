import { useEffect, useState, type ReactNode } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient } from '@/shared/lib/storage/queryClient';
import { persister, APP_VERSION } from '@/shared/lib/storage/persister';
import { db, SYNCED_TABLES } from '@/shared/lib/dexie/schema';
import { installDexieHooks } from '@/shared/lib/dexie/hooks';
import { isStorageWritable } from '@/shared/lib/sync/storageProbe';
import { pullSnapshot } from '@/shared/lib/sync/backupClient';
import { startScheduler, stopScheduler } from '@/shared/lib/sync/scheduler';
import { useAuthStore } from '@/features/auth/auth-store';
import { Sentry } from '@/shared/lib/observability/sentry';
import { diagLog } from '@/shared/lib/observability/diagLog';

// Boot sequence (Dexie + backup-polling):
//   1. Auth bootstrap (Supabase getSession).
//   2. Storage probe — surface eviction immediately, before Dexie tries to
//      open and gives obscure errors.
//   3. Install Dexie hooks (auto-stamp _dirty/edit_count/client_modified_at).
//   4. If Dexie is empty for this user, pull snapshot from /api/backup/snapshot.
//   5. Start the push scheduler.
//
// We keep the TanStack PersistQueryClientProvider wrapper so existing code
// that still calls supabase.from(...) keeps working until Step 4 migrates
// everything to useLiveQuery. The query cache will be evicted file-by-file
// as entities cut over to Dexie.

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
      onSuccess={() => {
        diagLog('[PQC] hydration onSuccess', {
          t_ms: Math.round(performance.now()),
          queries: queryClient.getQueryCache().getAll().length,
        });
      }}
    >
      <SyncBootstrap />
      {children}
    </PersistQueryClientProvider>
  );
}

let hooksInstalled = false;

function SyncBootstrap() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const userId = useAuthStore((s) => s.userId);
  const [error, setError] = useState<Error | null>(null);

  // 1. Auth bootstrap.
  useEffect(() => {
    let cancelled = false;
    const t0 = performance.now();
    diagLog('[SyncBootstrap] auth.bootstrap START', { t_ms: Math.round(t0) });
    (async () => {
      try {
        await useAuthStore.getState().bootstrap();
        diagLog('[SyncBootstrap] auth.bootstrap END', {
          dt_ms: Math.round(performance.now() - t0),
          isLoggedIn: useAuthStore.getState().isLoggedIn,
        });
      } catch (e) {
        diagLog('[SyncBootstrap] auth.bootstrap THROW', { err: String(e) });
        if (!cancelled) {
          Sentry.captureException(e, { tags: { phase: 'auth-bootstrap' }, level: 'fatal' });
          setError(e as Error);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 2-5. Storage probe → hooks → snapshot pull → scheduler.
  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    let cancelled = false;
    const t0 = performance.now();
    diagLog('[SyncBootstrap] dexie setup START', { t_ms: Math.round(t0), userId });

    (async () => {
      try {
        const writable = await isStorageWritable();
        diagLog('[SyncBootstrap] storage probe', { writable });
        if (!writable) {
          throw new Error('IndexedDB is not writable (storage evicted?)');
        }

        if (!hooksInstalled) {
          installDexieHooks();
          hooksInstalled = true;
        }

        // Decide whether we need a snapshot pull. We pull when Dexie has zero
        // rows for this user across all synced tables — signals fresh install,
        // logout-wipe, or post-eviction recovery.
        let totalLocal = 0;
        for (const table of SYNCED_TABLES) {
          totalLocal += await db[table].where('user_id').equals(userId).count();
        }
        diagLog('[SyncBootstrap] local row count', { totalLocal });

        if (totalLocal === 0) {
          const r = await pullSnapshot();
          diagLog('[SyncBootstrap] snapshot pull done', {
            rows: r.rows,
            dt_ms: Math.round(performance.now() - t0),
          });
        }

        if (cancelled) return;
        startScheduler(userId);
        diagLog('[SyncBootstrap] scheduler started', {
          dt_ms: Math.round(performance.now() - t0),
        });
      } catch (e) {
        diagLog('[SyncBootstrap] dexie setup THROW', { err: String(e) });
        if (!cancelled) {
          Sentry.captureException(e, { tags: { phase: 'dexie-bootstrap' }, level: 'fatal' });
          setError(e as Error);
        }
      }
    })();

    return () => {
      cancelled = true;
      stopScheduler();
    };
  }, [isLoggedIn, userId]);

  if (error) {
    return (
      <div style={{ padding: 24, color: 'red' }}>
        Failed to initialize sync: {error.message}
      </div>
    );
  }

  return null;
}
