import { get, set, del } from 'idb-keyval';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'dev';

export const persister = createAsyncStoragePersister({
  storage: {
    getItem: (key: string) => get<string>(key).then((v) => v ?? null),
    setItem: (key: string, value: string) => set(key, value),
    removeItem: (key: string) => del(key),
  },
  key: 'foodcalc-rq-cache',
  throttleTime: 1000,
});
