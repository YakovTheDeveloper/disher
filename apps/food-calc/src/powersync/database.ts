import { PowerSyncDatabase } from '@powersync/web';

import { AppSchema } from './schema';

// Shared Worker mode (multipleTabs: true) is mandatory on desktop:
// without it every tab opens its own WebSocket and one user with N tabs
// burns N of the 10-connection free-tier limit. With it, all same-origin
// tabs share one connection and one local SQLite file.
//
// Android Chrome (and a handful of mobile browsers) do not implement
// SharedWorker — enabling multi-tab there throws "SharedWorker is not defined"
// during init and the whole sync pipeline never starts. Mobile typically
// runs as a single PWA tab anyway, so the multi-tab loss is moot.
const supportsSharedWorker =
  typeof window !== 'undefined' && typeof window.SharedWorker !== 'undefined';

export const db = new PowerSyncDatabase({
  schema: AppSchema,
  database: {
    dbFilename: 'disher.db',
  },
  flags: {
    enableMultiTabs: supportsSharedWorker,
  },
});
