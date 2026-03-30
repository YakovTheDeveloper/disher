const LOG_KEY = 'disher_mutation_log';
const MAX_ENTRIES = 50;

export interface MutationLogEntry {
  ts: string;
  op: string;
  err: string;
}

export function logMutationError(operation: string, error: unknown) {
  try {
    const log: MutationLogEntry[] = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    log.push({
      ts: new Date().toISOString(),
      op: operation,
      err: error instanceof Error ? error.message : String(error),
    });
    if (log.length > MAX_ENTRIES) log.splice(0, log.length - MAX_ENTRIES);
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

export function getMutationLog(): MutationLogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearMutationLog() {
  localStorage.removeItem(LOG_KEY);
}
