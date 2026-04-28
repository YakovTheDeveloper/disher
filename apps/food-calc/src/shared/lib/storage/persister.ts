import { get, set, del } from 'idb-keyval';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'dev';

if (import.meta.env.PROD && APP_VERSION === 'dev') {
  // VITE_APP_VERSION is wired via vite.config.ts define{} from package.json.
  // If it falls through to 'dev' in a production bundle, schema-drift dropping
  // (pendingWrites + queryClient buster) silently no-ops on every release.
  console.warn('APP_VERSION fell back to "dev" in production — schema-drift dropping is disabled');
}

export const persister = createAsyncStoragePersister({
  storage: {
    getItem: (key: string) => get<string>(key).then((v) => v ?? null),
    setItem: (key: string, value: string) => set(key, value),
    removeItem: (key: string) => del(key),
  },
  key: 'foodcalc-rq-cache',
  throttleTime: 1000,
});
