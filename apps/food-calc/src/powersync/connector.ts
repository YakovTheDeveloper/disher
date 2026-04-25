import {
  type AbstractPowerSyncDatabase,
  type PowerSyncBackendConnector,
  type PowerSyncCredentials,
  UpdateType,
} from '@powersync/web';

import { supabase } from './supabase-client';

const POWERSYNC_URL = import.meta.env.VITE_POWERSYNC_URL;

if (!POWERSYNC_URL) {
  throw new Error('Missing VITE_POWERSYNC_URL in env');
}

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials(): Promise<PowerSyncCredentials | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const session = data.session;
    if (!session) return null;

    return {
      endpoint: POWERSYNC_URL,
      token: session.access_token,
      expiresAt: session.expires_at
        ? new Date(session.expires_at * 1000)
        : undefined,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const batch = await database.getCrudBatch();
    if (!batch) return;

    let lastEntry = null;
    try {
      for (const entry of batch.crud) {
        lastEntry = entry;
        const table = supabase.from(entry.table);

        if (entry.op === UpdateType.PUT) {
          const { error } = await table.upsert({
            id: entry.id,
            ...entry.opData,
          });
          if (error) throw error;
        } else if (entry.op === UpdateType.PATCH) {
          const { error } = await table.update(entry.opData ?? {}).eq('id', entry.id);
          if (error) throw error;
        } else if (entry.op === UpdateType.DELETE) {
          const { error } = await table.delete().eq('id', entry.id);
          if (error) throw error;
        }
      }
      await batch.complete();
    } catch (err) {
      console.error('PowerSync upload failed', { entry: lastEntry, err });
      throw err;
    }
  }
}
