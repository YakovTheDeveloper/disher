import { appendFile, mkdir } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_PATH = resolve(__dirname, "../../logs/matcher-queries.jsonl");

export type MatchVerdict = "alias" | "resolved" | "ambiguous" | "unresolved";

export interface ScoreBreakdown {
  trigram?: number;
  cosine?: number;
  hybrid?: number;
  levenshtein?: number;
}

export interface MatcherQueryLogEntry {
  ts: string;
  requestId: string;
  phrase: string;
  originalName: string;
  llmNote: string;
  llmQuantity: number | null;
  llmTime: string | null;
  normalizedName: string;
  verdict: MatchVerdict;
  top: Array<{ id: string; name: string; score: number }>;
  margin: number | null;
  scoreBreakdown?: ScoreBreakdown;
  aliasHit: boolean;
  matcherVersion: string;
  llmModel: string;
}

let mkdirDone = false;
let writeQueue: Promise<void> = Promise.resolve();

async function ensureDir(): Promise<void> {
  if (mkdirDone) return;
  await mkdir(dirname(LOG_PATH), { recursive: true });
  mkdirDone = true;
}

export function logMatcherQuery(entry: Omit<MatcherQueryLogEntry, "ts">): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n";
  writeQueue = writeQueue
    .then(ensureDir)
    .then(() => appendFile(LOG_PATH, line, "utf-8"))
    .catch((err) => {
      console.warn("matcher-query-log write failed:", err);
    });
}

export function getLogPath(): string {
  return LOG_PATH;
}
