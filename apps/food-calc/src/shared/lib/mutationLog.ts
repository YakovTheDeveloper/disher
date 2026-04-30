import type { ErrorKind } from './errors/classify';

const LOG_KEY = 'disher_mutation_log';
const MAX_ENTRIES = 50;

export interface MutationLogEntry {
  ts: string;
  op: string;
  err: string;
  kind?: ErrorKind['kind'];
  status?: number;
  code?: string;
}

/**
 * Append a structured error entry. Optional `classified` adds kind/status/code so
 * mutationLog becomes diagnosable without re-parsing the message.
 */
export function logMutationError(operation: string, error: unknown, classified?: ErrorKind) {
  try {
    const log: MutationLogEntry[] = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    const entry: MutationLogEntry = {
      ts: new Date().toISOString(),
      op: operation,
      err: error instanceof Error ? error.message : String(error),
    };
    if (classified) {
      entry.kind = classified.kind;
      if ('status' in classified && classified.status !== undefined) entry.status = classified.status;
      if ('code' in classified && classified.code) entry.code = classified.code;
    }
    log.push(entry);
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
