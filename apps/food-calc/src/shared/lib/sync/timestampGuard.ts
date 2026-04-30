// Notesnook-style timestamp guard for the drain ACK path.
//
// drainPush captures pushTimestamp BEFORE reading dirty rows. After the server
// ACKs a row, we may only clear _dirty if the row's client_modified_at is
// `<= pushTimestamp`. If the user mutated the row again WHILE the request was
// in flight (cma > pushTimestamp), keep _dirty=1 so the next drain catches it.
//
// This module is the pure decision; backupClient.drainPush plugs Dexie I/O
// around it. Same shape as the prior-art (Notesnook/Joplin) `synced=true
// WHERE dateModified<=pushTimestamp`.

export type GuardCandidate = {
  id: string;
  /** ISO string. */
  client_modified_at: string;
};

/**
 * Given the rows the server accepted (as fetched fresh from Dexie, post-ACK)
 * and the pushTimestamp captured at drain start, return the subset of ids
 * that may be marked clean. The complement keeps _dirty=1 because they were
 * mutated mid-flight.
 */
export function pickIdsSafeToClean(
  rows: ReadonlyArray<GuardCandidate>,
  pushTimestamp: string,
): string[] {
  const out: string[] = [];
  for (const r of rows) {
    if (r.client_modified_at && r.client_modified_at <= pushTimestamp) {
      out.push(r.id);
    }
  }
  return out;
}
