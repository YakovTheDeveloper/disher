import { TriplitClient } from "@triplit/client";
import { schema } from "@triplit-schema/schema";

const serverPort = 6543;
const host = window.location.hostname;

export const triplit = new TriplitClient({
  schema,
  serverUrl: `http://${host}:${serverPort}`,
  // In dev mode, triplit dev generates tokens automatically.
  // For production, use your auth provider's JWT.
  token: localStorage.getItem("triplit_token") ?? undefined,
  storage: "indexeddb",
});

export type Schema = typeof schema;
