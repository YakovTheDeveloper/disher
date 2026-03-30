import { v4 as uuid } from "uuid";
import { triplit } from "./client";
import { referenceDb } from "@/api/dexie/client";
import type { SyncWorkerResponse } from "@/api/dexie/sync.worker";
import SyncWorker from "@/api/dexie/sync.worker?worker";

// ─── Constants ───

const AUTH_TOKEN_KEY = "triplit_token";
const ANON_USER_ID_KEY = "anon_user_id";
const ANON_TOKEN = import.meta.env.VITE_TRIPLIT_TOKEN as string | undefined;
export const API_BASE = `http://${window.location.hostname}:3100`;

const SYSTEM_COLLECTIONS = ["foods", "foodPortions", "dailyNorms"] as const;
const COLLECTION_SYNC_TIMEOUT = 120_000; // 2 мин на коллекцию (страховка от зависания)
const REFERENCE_VERSION_KEY = "reference_data_version";

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

// ─── Sync Progress (per-collection state, consumed by SystemPage) ───

export type CollectionSyncState = "pending" | "syncing" | "done" | "timeout";
export type SyncProgress = Record<string, CollectionSyncState>;

type SyncProgressListener = (progress: SyncProgress) => void;

let _syncProgress: SyncProgress = {};
const _syncProgressListeners = new Set<SyncProgressListener>();

export function getSyncProgress(): SyncProgress {
  return _syncProgress;
}

export function onSyncProgressChange(listener: SyncProgressListener): () => void {
  _syncProgressListeners.add(listener);
  return () => _syncProgressListeners.delete(listener);
}

function setCollectionState(name: string, state: CollectionSyncState) {
  _syncProgress = { ..._syncProgress, [name]: state };
  _syncProgressListeners.forEach((fn) => fn(_syncProgress));
}

function resetSyncProgress() {
  const initial: SyncProgress = {};
  for (const name of SYSTEM_COLLECTIONS) initial[name] = "pending";
  _syncProgress = initial;
  _syncProgressListeners.forEach((fn) => fn(_syncProgress));
}

// ─── Sync Log (consumed by SystemPage) ───

export type SyncLogEntry = {
  time: string;
  level: "info" | "warn" | "error";
  message: string;
};

type SyncLogListener = (entries: SyncLogEntry[]) => void;

let _syncLog: SyncLogEntry[] = [];
const _syncLogListeners = new Set<SyncLogListener>();

export function getSyncLog(): SyncLogEntry[] {
  return _syncLog;
}

export function onSyncLogChange(listener: SyncLogListener): () => void {
  _syncLogListeners.add(listener);
  return () => _syncLogListeners.delete(listener);
}

function addSyncLog(level: SyncLogEntry["level"], message: string) {
  const time = new Date().toLocaleTimeString("ru-RU", { hour12: false });
  _syncLog = [..._syncLog, { time, level, message }];
  _syncLogListeners.forEach((fn) => fn(_syncLog));
  if (level === "error") console.error(`[session] ${message}`);
  else if (level === "warn") console.warn(`[session] ${message}`);
  else console.log(`[session] ${message}`);
}

// ─── Session Info (consumed by SystemPage) ───

export type SessionInfo = {
  mode: "user" | "anon";
  connected: boolean;
  skippedReason?: string;
  syncComplete: boolean;
};

let _sessionInfo: SessionInfo = {
  mode: "anon",
  connected: false,
  syncComplete: false,
};

export function getSessionInfo(): SessionInfo {
  return _sessionInfo;
}

// ─── Internal helpers ───

/**
 * Quick sanity check: does the local Triplit IDB have any foods?
 * If IndexedDB was cleared externally (browser settings, devtools, schema version bump)
 * but localStorage still has the reference version, we'd skip sync and show nothing.
 * This catches that case by doing a quick count query.
 */
async function verifyLocalDataExists(): Promise<boolean> {
  try {
    const result = await triplit.fetch(triplit.query("foods").Limit(1));
    return result.size > 0;
  } catch {
    return false;
  }
}

/**
 * Fetch the server's reference data version — a single number equal to the
 * sum of all system collection counts. Cheap: one SQLite COUNT per collection.
 * Retries up to 3 times (500 ms apart) to handle the startup race where the
 * TCP port is open but Fastify hasn't registered routes yet.
 * Returns null if all attempts fail or the server is genuinely unreachable.
 */
async function fetchServerVersion(): Promise<number | null> {
  const url = `${API_BASE}/api/system/version`;
  const ATTEMPTS = 3;
  const RETRY_DELAY = 500;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (!res.ok) return null;
      const data = await res.json() as { version: number };
      addSyncLog("info", `Server version: ${data.version}`);
      return data.version;
    } catch {
      if (attempt < ATTEMPTS) {
        addSyncLog("info", `Version check attempt ${attempt} failed, retrying...`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
      }
    }
  }
  return null;
}

function getLocalVersion(): number | null {
  const v = localStorage.getItem(REFERENCE_VERSION_KEY);
  return v !== null ? Number(v) : null;
}

function saveLocalVersion(version: number) {
  localStorage.setItem(REFERENCE_VERSION_KEY, String(version));
}

/**
 * Subscribe to one collection and wait for onRemoteFulfilled.
 * Each collection has its own 2-minute timeout — independent of other collections.
 */
function waitForCollection(name: string): Promise<"done" | "timeout"> {
  setCollectionState(name, "syncing");
  addSyncLog("info", `  ${name}: syncing...`);

  return new Promise<"done" | "timeout">((resolve) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      addSyncLog("warn", `  ${name}: timeout after ${COLLECTION_SYNC_TIMEOUT / 1000}s`);
      setCollectionState(name, "timeout");
      unsub();
      resolve("timeout");
    }, COLLECTION_SYNC_TIMEOUT);

    const unsub = triplit.subscribe(
      // @ts-expect-error — dynamic collection name
      triplit.query(name),
      () => {},
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        addSyncLog("error", `  ${name}: error — ${error}`);
        setCollectionState(name, "timeout");
        unsub();
        resolve("timeout");
      },
      {
        onRemoteFulfilled: () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          addSyncLog("info", `  ${name}: done`);
          setCollectionState(name, "done");
          unsub();
          resolve("done");
        },
      },
    );
  });
}

// ─── initSession — single entry point ───

/**
 * Initialize the Triplit session on app startup.
 *
 * Flow:
 * 1. User token → connect and stay connected (full sync, Triplit manages it).
 * 2. Anon → fetch server version (single number), compare with localStorage.
 *    Match  → already synced, done (no Triplit connection needed).
 *    Mismatch → connect, sync all collections, save new version, disconnect.
 * 3. Server unreachable + local version exists → use cached data (offline mode).
 * 4. Server unreachable + no local version → offline, no data.
 *
 * No IDB reads, no retry loops, no race conditions.
 * onRemoteFulfilled is the authoritative "sync done" signal — we trust it.
 */
export async function initSession(): Promise<void> {
  const userToken = localStorage.getItem(AUTH_TOKEN_KEY);

  // ── User mode: connect and stay connected ──
  if (userToken) {
    addSyncLog("info", "User token found, connecting...");
    setSyncStatus("syncing");
    _sessionInfo = { mode: "user", connected: true, syncComplete: true };

    try {
      await triplit.startSession(userToken, true, {
        refreshHandler: refreshToken,
      });
      setSyncStatus("synced");
      addSyncLog("info", "Authenticated session started.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addSyncLog("error", `Failed to start authenticated session: ${msg}`);
      setSyncStatus("offline");
      _sessionInfo = { ...(_sessionInfo), connected: false, skippedReason: "Failed to connect with user token", syncComplete: false };
    }

    // Ensure Dexie has foodNutrients (may be missing if user never visited in anon mode)
    ensureDexieFoodNutrients();
    return;
  }

  // ── Anon mode: version check ──
  addSyncLog("info", "Checking reference data version...");
  const serverVersion = await fetchServerVersion();

  if (serverVersion === null) {
    const localVersion = getLocalVersion();
    if (localVersion !== null) {
      addSyncLog("info", "Server unreachable. Using cached reference data.");
      setSyncStatus("synced");
      _sessionInfo = { mode: "anon", connected: false, skippedReason: "Server unreachable, using cache", syncComplete: false };
    } else {
      addSyncLog("error", "Server unreachable and no local data.");
      setSyncStatus("offline");
      _sessionInfo = { mode: "anon", connected: false, skippedReason: "Server unreachable", syncComplete: false };
    }
    return;
  }

  const localVersion = getLocalVersion();
  if (localVersion === serverVersion) {
    // Sanity check: verify IndexedDB actually has data.
    // If IDB was cleared (e.g. browser, devtools) but localStorage version persisted,
    // we'd skip sync and show zero products.
    const hasLocalData = await verifyLocalDataExists();
    if (hasLocalData) {
      addSyncLog("info", `Reference data up to date (v${serverVersion}). No sync needed.`);
      setSyncStatus("synced");
      _sessionInfo = { mode: "anon", connected: false, skippedReason: "Version match", syncComplete: true };
      ensureDexieFoodNutrients();
      return;
    }
    addSyncLog("warn", "Version match but IndexedDB is empty — forcing re-sync.");
    localStorage.removeItem(REFERENCE_VERSION_KEY);
  }

  addSyncLog("info", `Version mismatch (local: ${localVersion ?? "none"} → server: ${serverVersion}). Syncing...`);
  await syncReferenceData(serverVersion);
}

/**
 * If Dexie foodNutrients table is empty, trigger a full sync.
 * Runs in background (fire-and-forget) so it doesn't block session init.
 */
function ensureDexieFoodNutrients(): void {
  referenceDb.foodNutrients.count().then((count) => {
    if (count > 0) return;
    addSyncLog("info", "Dexie foodNutrients empty, syncing...");
    syncFoodNutrientsToDexie().catch((e) => {
      addSyncLog("warn", `  foodNutrients (Dexie): failed — ${e instanceof Error ? e.message : String(e)}`);
    });
  });
}

/**
 * Bulk-load USDA foodNutrients via Web Worker (no main-thread jank).
 * Worker handles: fetch → parse ndjson → Dexie bulkPut.
 * Main thread only receives progress/done/error messages.
 */
function syncFoodNutrientsToDexie(): Promise<void> {
  addSyncLog("info", "  foodNutrients (Worker): syncing...");

  // Clean up old v1 database if it exists
  indexedDB.deleteDatabase("disher-reference");

  return new Promise<void>((resolve, reject) => {
    const worker = new SyncWorker();

    worker.onmessage = (e: MessageEvent<SyncWorkerResponse>) => {
      const msg = e.data;
      if (msg.type === "progress") {
        addSyncLog("info", `  foodNutrients (Worker): ${msg.count} foods...`);
      } else if (msg.type === "done") {
        addSyncLog("info", `  foodNutrients (Worker): done (${msg.total} foods)`);
        worker.terminate();
        resolve();
      } else if (msg.type === "error") {
        addSyncLog("error", `  foodNutrients (Worker): ${msg.message}`);
        worker.terminate();
        reject(new Error(msg.message));
      }
    };

    worker.onerror = (e) => {
      addSyncLog("error", `  foodNutrients (Worker): ${e.message}`);
      worker.terminate();
      reject(new Error(e.message));
    };

    worker.postMessage({
      type: "start",
      url: `${API_BASE}/api/system/export/food-nutrients`,
      timeoutMs: COLLECTION_SYNC_TIMEOUT,
    });
  });
}

/**
 * Connect with anon token, sync all system collections, disconnect.
 * Saves the new version to localStorage on success so the next startup is instant.
 */
async function syncReferenceData(serverVersion: number | null): Promise<void> {
  if (!ANON_TOKEN) {
    addSyncLog("error", "No anon token (VITE_TRIPLIT_TOKEN), cannot sync.");
    setSyncStatus("offline");
    _sessionInfo = { mode: "anon", connected: false, skippedReason: "No anon token", syncComplete: false };
    return;
  }

  setSyncStatus("syncing");

  try {
    await triplit.startSession(ANON_TOKEN);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    addSyncLog("error", `Failed to connect: ${msg}`);
    setSyncStatus("offline");
    _sessionInfo = { mode: "anon", connected: false, skippedReason: `Connection failed: ${msg}`, syncComplete: false };
    return;
  }

  addSyncLog("info", "Syncing system collections...");
  resetSyncProgress();
  const [results] = await Promise.all([
    Promise.all(SYSTEM_COLLECTIONS.map(waitForCollection)),
    syncFoodNutrientsToDexie().catch((e) => {
      addSyncLog("warn", `  foodNutrients (Dexie): failed — ${e instanceof Error ? e.message : String(e)}`);
    }),
  ]);

  // Save version before disconnecting.
  // We trust onRemoteFulfilled as the authoritative sync-complete signal.
  // Even if some collections timed out, save the version for those that succeeded;
  // a forced re-sync can be triggered manually from SystemPage if needed.
  if (serverVersion !== null) {
    saveLocalVersion(serverVersion);
  }

  try {
    await triplit.endSession();
  } catch (e) {
    addSyncLog("warn", `endSession error: ${e instanceof Error ? e.message : String(e)}`);
  }

  const timedOut = SYSTEM_COLLECTIONS.filter((_, i) => results[i] === "timeout");
  if (timedOut.length > 0) {
    addSyncLog("warn", `Sync complete with timeouts: ${timedOut.join(", ")}`);
  } else {
    addSyncLog("info", "All system collections synced.");
  }

  setSyncStatus("synced");
  _sessionInfo = { mode: "anon", connected: false, syncComplete: timedOut.length === 0 };
}

// ─── Public sync trigger ───

/** Re-run the full init flow. Can be called from UI for manual retry after failure. */
export async function syncNow(): Promise<void> {
  // Force re-sync by clearing the cached version
  localStorage.removeItem(REFERENCE_VERSION_KEY);
  await initSession();
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

  // reset() clears sync metadata from the anon session — without it,
  // the client reuses the anon sync cursor and may show stale/wrong data.
  if (triplit.token) {
    await triplit.endSession();
  }
  await triplit.reset();
  await triplit.startSession(jwt, true, {
    refreshHandler: refreshToken,
  });

  const payload = JSON.parse(atob(jwt.split(".")[1]));
  if (payload.sub) {
    await migrateAnonData(anonId, payload.sub);
  }
}

async function migrateAnonData(anonId: string, realUserId: string): Promise<void> {
  if (anonId === realUserId) return;

  const collections = [
    "foods", "foodPortions", "scheduleFoods", "scheduleEvents",
    "dishes", "dishItems", "dailyNorms",
  ] as const;

  // Fetch all records first, then update atomically in a single transaction
  const allUpdates: Array<{ collection: string; id: string }> = [];
  for (const collection of collections) {
    const records = await triplit.fetch(
      // @ts-expect-error — dynamic collection name
      triplit.query(collection).Where("userId", "=", anonId),
    );
    for (const id of records.keys()) {
      allUpdates.push({ collection, id: String(id) });
    }
  }

  if (allUpdates.length > 0) {
    await triplit.transact(async (tx) => {
      for (const { collection, id } of allUpdates) {
        // @ts-expect-error — dynamic collection name
        await tx.update(collection, id, (rec) => { rec.userId = realUserId; });
      }
    });
  }

  localStorage.removeItem(ANON_USER_ID_KEY);
}

export async function logout(): Promise<void> {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(ANON_USER_ID_KEY);
  // reset() wipes sync metadata so the next user (or anon session)
  // doesn't inherit stale sync cursors from the previous account.
  await triplit.endSession();
  await triplit.reset();
  await initSession();
}

// ─── Token refresh ───

/**
 * Called by Triplit when the JWT is about to expire.
 * Posts the current token to /api/auth/refresh to get a fresh one.
 * Returns null on failure — Triplit will disconnect gracefully.
 */
async function refreshToken(): Promise<string | null> {
  const currentToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!currentToken) return null;

  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      },
    });
    if (!res.ok) return null;
    const { token } = await res.json();
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    addSyncLog("info", "Token refreshed successfully.");
    return token;
  } catch {
    addSyncLog("warn", "Token refresh failed.");
    return null;
  }
}
