import { TriplitClient } from "@triplit/client";
import { schema } from "@triplit-schema/schema";

const serverPort = 6543;
const host = window.location.hostname;
const SERVER_URL = `http://${host}:${serverPort}`;
const ANON_TOKEN = import.meta.env.VITE_TRIPLIT_TOKEN;

// Schema version — bump this when schema changes to auto-clear stale IndexedDB
const SCHEMA_VERSION = "2";
const SCHEMA_VERSION_KEY = "triplit_schema_version";

const storedVersion = localStorage.getItem(SCHEMA_VERSION_KEY);
if (storedVersion !== SCHEMA_VERSION) {
  console.warn("[triplit] Schema version changed:", storedVersion, "→", SCHEMA_VERSION, "— clearing IndexedDB...");
  // Synchronously delete known Triplit databases; new client will re-create them
  const dbNames = ["triplit", "triplit-cache", "triplit-outbox", "triplit-metadata"];
  for (const name of dbNames) {
    try { indexedDB.deleteDatabase(name); } catch { /* ignore */ }
  }
  // Also try to delete any database with "triplit" in the name
  if (indexedDB.databases) {
    indexedDB.databases().then(dbs => {
      for (const db of dbs) {
        if (db.name?.includes("triplit")) {
          console.log("[triplit] Deleting stale IDB:", db.name);
          indexedDB.deleteDatabase(db.name!);
        }
      }
    });
  }
  localStorage.setItem(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
  console.log("[triplit] IndexedDB cleared, reloading...");
  window.location.reload();
}

export const triplit = new TriplitClient({
  schema,
  serverUrl: SERVER_URL,
  storage: "indexeddb",
  // Don't connect automatically — syncSystemData() will connect,
  // pull __system__ data, then disconnect. Full sync only on login.
  autoConnect: false,
});

export function isUserToken(t: string | undefined): boolean {
  if (!t) return false;
  try {
    const payload = JSON.parse(atob(t.split(".")[1]));
    return !!payload.sub;
  } catch {
    return false;
  }
}

// System collections that anon users need synced before the app renders
const SYSTEM_COLLECTIONS = ["nutrients", "foods", "dailyNorms", "dailyNormItems"] as const;
const SYNC_TIMEOUT = 8_000;
const HEALTH_CHECK_TIMEOUT = 2_000;

/** Sync status exposed to the app */
export type SyncStatus = "idle" | "syncing" | "synced" | "offline";
type SyncListener = (status: SyncStatus) => void;

let _syncStatus: SyncStatus = "idle";
const _syncListeners = new Set<SyncListener>();

export function getSyncStatus(): SyncStatus {
  return _syncStatus;
}

export function onSyncStatusChange(listener: SyncListener): () => void {
  _syncListeners.add(listener);
  return () => _syncListeners.delete(listener);
}

function setSyncStatus(status: SyncStatus) {
  _syncStatus = status;
  _syncListeners.forEach((fn) => fn(status));
}

/**
 * Fast HTTP health check — resolves true if server responds within 2s.
 * Uses /healthcheck or falls back to a HEAD request to the server URL.
 */
async function isServerReachable(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

  try {
    const res = await fetch(SERVER_URL, {
      method: "HEAD",
      signal: controller.signal,
    });
    return res.ok || res.status === 426; // 426 = WebSocket upgrade expected, server is alive
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Check if we already have local data in IndexedDB from a previous sync.
 * If nutrients exist locally, we can render immediately without blocking on server.
 */
async function hasLocalData(): Promise<boolean> {
  try {
    const result = await triplit.fetch(triplit.query("nutrients"));
    return result.size > 0;
  } catch {
    return false;
  }
}

/**
 * Subscribe to a collection and resolve when the server has responded
 * (onRemoteFulfilled). No hardcoded counts — just waits for the server's answer.
 */
function waitForServerResponse(name: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const unsub = triplit.subscribe(
      // @ts-expect-error — dynamic collection name
      triplit.query(name),
      () => {},          // results callback (unused — we only care about fulfillment)
      (error) => {       // error callback
        console.error(`[anon-sync] ${name} error:`, error);
        unsub();
        resolve();       // don't block startup
      },
      {
        onRemoteFulfilled: () => {
          console.log(`[anon-sync] ${name}: synced`);
          unsub();
          resolve();
        },
      },
    );
  });
}

/**
 * Sync system data from the server. Non-blocking if local data already exists.
 * 1. Quick health check — if server is unreachable, skip immediately
 * 2. If IndexedDB has data from previous sync — sync in background, don't block
 * 3. If no local data (first visit) — wait up to 8s for initial sync
 */
async function syncSystemData(): Promise<void> {
  setSyncStatus("syncing");

  const reachable = await isServerReachable();
  if (!reachable) {
    console.warn("[anon-sync] Server unreachable, using local data only.");
    setSyncStatus("offline");
    return;
  }

  await triplit.startSession(ANON_TOKEN!);

  const syncAll = Promise.all(SYSTEM_COLLECTIONS.map(waitForServerResponse));

  const timeout = new Promise<void>((resolve) =>
    setTimeout(() => {
      console.warn(`[anon-sync] Timed out after ${SYNC_TIMEOUT / 1000}s, disconnecting.`);
      resolve();
    }, SYNC_TIMEOUT),
  );

  await Promise.race([syncAll, timeout]);

  await triplit.endSession();
  setSyncStatus("synced");
  console.log("[anon-sync] Disconnected.");
}

/**
 * Connect with anon token, sync all system data (nutrients, foods, norms),
 * then disconnect. Anonymous users don't need a live connection —
 * all system data is immutable.
 *
 * Returns immediately if local data exists — sync happens in background.
 * Only blocks on first-ever visit when IndexedDB is empty.
 */
export async function startAnonSession(): Promise<void> {
  if (!ANON_TOKEN) {
    console.warn("startAnonSession: no ANON_TOKEN, skipping");
    return;
  }

  const hasCached = await hasLocalData();

  if (hasCached) {
    console.log("[anon-sync] Local data found, syncing in background.");
    // Fire and forget — app renders immediately with cached data
    syncSystemData().catch((err) => {
      console.error("[anon-sync] Background sync failed:", err);
      setSyncStatus("offline");
    });
    return;
  }

  // First visit — no local data, must wait for sync
  console.log("[anon-sync] No local data, waiting for initial sync...");
  await syncSystemData();
}

if (import.meta.env.DEV) {
  const db = {
    async all(collection: string) {
      const res = await triplit.fetch(triplit.query(collection));
      const rows = [...res.values()];
      console.table(rows);
      return rows;
    },
    async count(collection: string) {
      const res = await triplit.fetch(triplit.query(collection));
      const n = res.size;
      console.log(`${collection}: ${n} rows`);
      return n;
    },
    async where(collection: string, field: string, op: string, value: any) {
      const res = await triplit.fetch(
        triplit.query(collection).Where(field, op as any, value),
      );
      const rows = [...res.values()];
      console.table(rows);
      return rows;
    },
    async get(collection: string, id: string) {
      const res = await triplit.fetchById(collection, id);
      console.log(res);
      return res;
    },
    async sync(collection: string) {
      const local = await triplit.fetch(triplit.query(collection));
      console.log(`${collection} local: ${local.size} rows`);
      console.log("connection:", triplit.syncEngine.connectionStatus);
      return { local: local.size, connection: triplit.syncEngine.connectionStatus };
    },
    client: triplit,
  };
  (window as any).db = db;
  console.log(
    "%c🔧 Triplit debug: window.db",
    "color: #4fc3f7; font-weight: bold",
    "\n  db.all('foods')           — all rows" +
    "\n  db.count('foods')         — count rows" +
    "\n  db.get('foods', id)       — get by id" +
    "\n  db.where('foods','name','like','%text%') — filter" +
    "\n  db.sync('foods')          — local count + connection status" +
    "\n  db.client                 — raw TriplitClient",
  );
}

export type Schema = typeof schema;
