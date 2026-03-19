import { TriplitClient } from "@triplit/client";
import { schema } from "@triplit-schema/schema";

const serverPort = 6543;
const host = window.location.hostname;
const SERVER_URL = `http://${host}:${serverPort}`;
const ANON_TOKEN = import.meta.env.VITE_TRIPLIT_TOKEN;

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

/**
 * Connect with anon token, wait for __system__ data to sync into IndexedDB,
 * then disconnect. Called once on app startup for anonymous users.
 */
export async function syncSystemData(): Promise<void> {
  if (!ANON_TOKEN) return;

  await triplit.startSession(ANON_TOKEN);

  // Give sync time to pull __system__ data, then disconnect
  await new Promise((r) => setTimeout(r, 3000));

  await triplit.endSession();
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
    collections() {
      const names = Object.keys(triplit.schema?.collections ?? {});
      console.log("Collections:", names);
      return names;
    },
    client: triplit,
  };
  (window as any).db = db;
  console.log(
    "%c🔧 Triplit debug: window.db",
    "color: #4fc3f7; font-weight: bold",
    "\n  db.collections()          — list collections" +
    "\n  db.all('foods')           — all rows" +
    "\n  db.count('foods')         — count rows" +
    "\n  db.get('foods', id)       — get by id" +
    "\n  db.where('foods','name','like','%text%') — filter" +
    "\n  db.sync('foods')          — local count + connection status" +
    "\n  db.client                 — raw TriplitClient",
  );
}

export type Schema = typeof schema;
