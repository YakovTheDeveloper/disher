import { v4 as uuid } from "uuid";
import { triplit, SERVER_URL } from "./client";

// ─── Constants ───

const AUTH_TOKEN_KEY = "triplit_token";
const ANON_USER_ID_KEY = "anon_user_id";
const ANON_TOKEN = import.meta.env.VITE_TRIPLIT_TOKEN as string | undefined;

const SYSTEM_COLLECTIONS = ["nutrients", "foods", "foodNutrients", "dailyNorms", "dailyNormItems"] as const;
const SYNC_TIMEOUT = 8_000;
const HEALTH_CHECK_TIMEOUT = 2_000;

// ─── Sync Status (consumed by SyncProvider) ───

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

// ─── Session Info (consumed by SystemPage) ───

export type SessionInfo = {
  mode: "user" | "anon";
  connected: boolean;
  skippedReason?: string;
  localCounts: Record<string, number>;
};

let _sessionInfo: SessionInfo = {
  mode: "anon",
  connected: false,
  localCounts: {},
};

export function getSessionInfo(): SessionInfo {
  return _sessionInfo;
}

// ─── Internal helpers ───

async function isServerReachable(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);
  try {
    const res = await fetch(SERVER_URL, {
      method: "HEAD",
      signal: controller.signal,
    });
    return res.ok || res.status === 426;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchLocalCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const name of SYSTEM_COLLECTIONS) {
    try {
      // @ts-expect-error — dynamic collection name
      const res = await triplit.fetch(triplit.query(name));
      counts[name] = res instanceof Map ? res.size : Array.isArray(res) ? res.length : 0;
    } catch {
      counts[name] = 0;
    }
  }
  return counts;
}

function waitForServerResponse(name: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const unsub = triplit.subscribe(
      // @ts-expect-error — dynamic collection name
      triplit.query(name),
      () => {},
      (error) => {
        console.error(`[session] ${name} sync error:`, error);
        unsub();
        resolve();
      },
      {
        onRemoteFulfilled: () => {
          console.log(`[session] ${name}: synced`);
          unsub();
          resolve();
        },
      },
    );
  });
}

async function syncSystemCollections(): Promise<void> {
  const syncAll = Promise.all(SYSTEM_COLLECTIONS.map(waitForServerResponse));
  const timeout = new Promise<void>((resolve) =>
    setTimeout(() => {
      console.warn(`[session] Sync timed out after ${SYNC_TIMEOUT / 1000}s`);
      resolve();
    }, SYNC_TIMEOUT),
  );
  await Promise.race([syncAll, timeout]);
}

// ─── initSession — single entry point ───

/**
 * Initialize the Triplit session on app startup.
 *
 * Flow:
 * 1. User token in localStorage → connect and stay connected (full sync).
 * 2. Anon + local data cached   → don't connect at all.
 * 3. Anon + no local data       → connect, pull system data, disconnect.
 */
export async function initSession(): Promise<void> {
  const userToken = localStorage.getItem(AUTH_TOKEN_KEY);

  // ── Step 1: Count what we have locally ──
  const localCounts = await fetchLocalCounts();
  const totalLocal = Object.values(localCounts).reduce((a, b) => a + b, 0);

  // ── Step 2: User mode — connect and stay connected ──
  if (userToken) {
    console.log("[session] User token found, connecting...");
    setSyncStatus("syncing");
    _sessionInfo = { mode: "user", connected: true, localCounts };

    try {
      await triplit.startSession(userToken);
      setSyncStatus("synced");
      console.log("[session] Authenticated session started.");
    } catch (err) {
      console.error("[session] Failed to start authenticated session:", err);
      setSyncStatus("offline");
      _sessionInfo.connected = false;
      _sessionInfo.skippedReason = "Failed to connect with user token";
    }
    return;
  }

  // ── Step 3: Anon + local data exists — don't connect ──
  if (totalLocal > 0) {
    console.log(`[session] Local data found (${totalLocal} rows), skipping sync.`);
    setSyncStatus("synced");
    _sessionInfo = {
      mode: "anon",
      connected: false,
      skippedReason: "Local data already cached",
      localCounts,
    };
    return;
  }

  // ── Step 4: Anon + no data — need to fetch from server ──
  if (!ANON_TOKEN) {
    console.warn("[session] No anon token configured, cannot sync.");
    setSyncStatus("offline");
    _sessionInfo = {
      mode: "anon",
      connected: false,
      skippedReason: "No anon token (VITE_TRIPLIT_TOKEN)",
      localCounts,
    };
    return;
  }

  const reachable = await isServerReachable();
  if (!reachable) {
    console.warn("[session] Server unreachable.");
    setSyncStatus("offline");
    _sessionInfo = {
      mode: "anon",
      connected: false,
      skippedReason: "Server unreachable",
      localCounts,
    };
    return;
  }

  // Connect → pull system data → disconnect
  console.log("[session] First visit — syncing system data...");
  setSyncStatus("syncing");

  await triplit.startSession(ANON_TOKEN);
  await syncSystemCollections();
  await triplit.endSession();

  const updatedCounts = await fetchLocalCounts();
  setSyncStatus("synced");
  _sessionInfo = { mode: "anon", connected: false, localCounts: updatedCounts };
  console.log("[session] System data synced, disconnected.");
}

// ─── Auth helpers ───

export function getCurrentUserId(): string {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.sub) return payload.sub;
    } catch { /* fall through */ }
  }
  return getAnonUserId();
}

export function getAnonUserId(): string {
  let id = localStorage.getItem(ANON_USER_ID_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(ANON_USER_ID_KEY, id);
  }
  return id;
}

export async function loginWithToken(jwt: string): Promise<void> {
  const anonId = getAnonUserId();

  localStorage.setItem(AUTH_TOKEN_KEY, jwt);

  if (triplit.token) {
    await triplit.endSession();
  }
  await triplit.startSession(jwt);

  const payload = JSON.parse(atob(jwt.split(".")[1]));
  if (payload.sub) {
    await migrateAnonData(anonId, payload.sub);
  }
}

async function migrateAnonData(anonId: string, realUserId: string): Promise<void> {
  if (anonId === realUserId) return;

  const collections = [
    "foods", "foodPortions", "scheduleFoods", "scheduleEvents",
    "dishes", "dishItems", "dailyNorms", "dailyNormItems",
  ] as const;

  await Promise.all(
    collections.map(async (collection) => {
      const records = await triplit.fetch(
        // @ts-expect-error — dynamic collection name
        triplit.query(collection).Where("userId", "=", anonId),
      );
      await Promise.all(
        Array.from(records.keys()).map((id) =>
          triplit.update(
            collection, String(id), (rec) => { rec.userId = realUserId; },
          ),
        ),
      );
    }),
  );

  localStorage.removeItem(ANON_USER_ID_KEY);
}

export async function logout(): Promise<void> {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(ANON_USER_ID_KEY);
  await triplit.endSession();
  await initSession();
}
