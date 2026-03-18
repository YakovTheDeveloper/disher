import { TriplitClient } from "@triplit/client";
import { schema } from "@triplit-schema/schema";

const serverPort = 6543;
const host = window.location.hostname;

const token =
  import.meta.env.VITE_TRIPLIT_TOKEN ??
  localStorage.getItem("triplit_token") ??
  undefined;

function isUserToken(t: string | undefined): boolean {
  if (!t) return false;
  try {
    const payload = JSON.parse(atob(t.split(".")[1]));
    return !!payload.sub;
  } catch {
    return false;
  }
}

export const triplit = new TriplitClient({
  schema,
  serverUrl: `http://${host}:${serverPort}`,
  token,
  storage: "indexeddb",
  // Only sync when the user is authenticated (token has a `sub` claim).
  // Anon tokens don't have `sub` — those users work offline-first via IndexedDB.
  // On login, loginWithToken() calls updateToken() which reconnects and syncs.
  autoConnect: isUserToken(token),
});

export type Schema = typeof schema;
