import { PowerSyncDatabase } from '@powersync/web';

import { AppSchema } from './schema';

// Shared Worker mode (multipleTabs: true) is mandatory:
// without it every tab opens its own WebSocket and one user with N tabs
// burns N of the 10-connection free-tier limit. With it, all same-origin
// tabs share one connection and one local SQLite file.
export const db = new PowerSyncDatabase({
  schema: AppSchema,
  database: {
    dbFilename: 'disher.db',
  },
  flags: {
    enableMultiTabs: true,
  },
});
