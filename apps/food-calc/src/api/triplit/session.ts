import { v4 as uuid } from "uuid";
import { triplit, syncSystemData } from "./client";

const ANON_USER_ID_KEY = "anon_user_id";
const AUTH_TOKEN_KEY = "triplit_token";

/**
 * Initialize the Triplit session on app startup.
 * - If user token exists in localStorage → start authenticated session (full sync).
 * - Otherwise → pull __system__ data with anon token, then disconnect.
 */
export async function initSession(): Promise<void> {
  const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (savedToken) {
    await triplit.startSession(savedToken);
  } else {
    await syncSystemData();
  }
}

/**
 * Returns the current userId — either the real one from JWT or the local anon UUID.
 */
export function getCurrentUserId(): string {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.sub) return payload.sub;
    } catch {
      // malformed token — fall through to anon
    }
  }
  return getAnonUserId();
}

/**
 * Returns (or creates) the persistent anon UUID stored in localStorage.
 */
export function getAnonUserId(): string {
  let id = localStorage.getItem(ANON_USER_ID_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(ANON_USER_ID_KEY, id);
  }
  return id;
}

/**
 * Call on successful login/signup.
 * Switches to authenticated session, migrates local anon data to the real userId.
 */
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

/**
 * Migrates all records belonging to anonId → realUserId so they pass server permissions and sync.
 */
async function migrateAnonData(anonId: string, realUserId: string): Promise<void> {
  if (anonId === realUserId) return;

  const collections = [
    "foods",
    "foodPortions",
    "scheduleFoods",
    "scheduleEvents",
    "dishes",
    "dishItems",
    "dailyNorms",
    "dailyNormItems",
  ] as const;

  await Promise.all(
    collections.map(async (collection) => {
      const records = await triplit.fetch(
        triplit.query(collection).Where("userId", "=", anonId),
      );
      await Promise.all(
        Array.from(records.keys()).map((id) =>
          triplit.update(collection, id as string, (rec: any) => {
            rec.userId = realUserId;
          }),
        ),
      );
    }),
  );

  localStorage.removeItem(ANON_USER_ID_KEY);
}

/**
 * Logout: end authenticated session, pull __system__ data as anon, then disconnect.
 */
export async function logout(): Promise<void> {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(ANON_USER_ID_KEY);

  await triplit.endSession();
  await syncSystemData();
}
