import { TriplitClient } from "@triplit/client";
import { schema } from "@triplit-schema/schema";

const serverPort = 6543;
const host = window.location.hostname;
export const SERVER_URL = `http://${host}:${serverPort}`;

// Schema version — bump this when schema changes to auto-clear stale IndexedDB
const SCHEMA_VERSION = "5";
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
  // Don't connect automatically — initSession() handles connection.
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
