import { v4 as uuid } from "uuid";
import { triplit } from "./client";

const ANON_USER_ID_KEY = "anon_user_id";
const AUTH_TOKEN_KEY = "triplit_token";

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
 * Updates the Triplit token, migrates all local anon records to the real userId, then enables sync.
 */
export async function loginWithToken(jwt: string): Promise<void> {
  const anonId = getAnonUserId();

  localStorage.setItem(AUTH_TOKEN_KEY, jwt);
  triplit.updateToken(jwt); // reconnects automatically with the new token

  await migrateAnonData(anonId, getCurrentUserId());
}

/**
 * Migrates all records belonging to anonId → realUserId so they pass server permissions and sync.
 */
async function migrateAnonData(anonId: string, realUserId: string): Promise<void> {
  if (anonId === realUserId) return;

  const collections = [
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

export function logout(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  triplit.disconnect();
  // Re-generate a fresh anon ID for the next session
  localStorage.removeItem(ANON_USER_ID_KEY);
}
