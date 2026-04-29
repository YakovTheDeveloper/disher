import { get, set, del } from 'idb-keyval';

// Boot-time probe: write → read → delete a tiny IndexedDB key. If any step
// throws, the device has evicted our storage (Safari ITP, low disk, manual
// "clear browsing data") and we surface a recovery flow instead of letting
// Dexie throw obscure errors later. Ref: backup-polling-implementation-guide
// §4.5 + project_outbox_audit_2026_04_28.md.

const PROBE_KEY = '__disher_probe__';

export async function isStorageWritable(): Promise<boolean> {
  try {
    const value = `${Date.now()}`;
    await set(PROBE_KEY, value);
    const read = await get<string>(PROBE_KEY);
    await del(PROBE_KEY);
    return read === value;
  } catch {
    return false;
  }
}
