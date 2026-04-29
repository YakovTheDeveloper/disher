import { get, set, del } from 'idb-keyval';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { diagLog } from '@/shared/lib/observability/diagLog';

export const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'dev';

if (import.meta.env.PROD && APP_VERSION === 'dev') {
  // VITE_APP_VERSION is wired via vite.config.ts define{} from package.json.
  // If it falls through to 'dev' in a production bundle, the queryClient
  // cache buster silently no-ops on every release.
  console.warn('APP_VERSION fell back to "dev" in production — schema-drift dropping is disabled');
}

export const persister = createAsyncStoragePersister({
  storage: {
    getItem: async (key: string) => {
      const t0 = performance.now();
      diagLog('[persister] getItem START', { key });
      try {
        const v = await get<string>(key);
        const dt = Math.round(performance.now() - t0);
        const size = typeof v === 'string' ? v.length : 0;
        diagLog('[persister] getItem END', { key, dt_ms: dt, size_chars: size, hasValue: v != null });
        return v ?? null;
      } catch (err) {
        const dt = Math.round(performance.now() - t0);
        diagLog('[persister] getItem THROW', { key, dt_ms: dt, err: String(err) });
        throw err;
      }
    },
    setItem: async (key: string, value: string) => {
      const t0 = performance.now();
      diagLog('[persister] setItem START', { key, size_chars: value.length });
      try {
        await set(key, value);
        const dt = Math.round(performance.now() - t0);
        diagLog('[persister] setItem END', { key, dt_ms: dt });
      } catch (err) {
        const dt = Math.round(performance.now() - t0);
        diagLog('[persister] setItem THROW', { key, dt_ms: dt, err: String(err) });
        throw err;
      }
    },
    removeItem: async (key: string) => {
      diagLog('[persister] removeItem', { key });
      await del(key);
    },
  },
  key: 'foodcalc-rq-cache',
  throttleTime: 1000,
});
