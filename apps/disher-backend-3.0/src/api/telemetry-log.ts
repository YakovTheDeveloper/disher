import { appendFile, mkdir } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = resolve(__dirname, "../../data/telemetry");

export type CorrectionType =
  | "accepted-top1"
  | "switched-ambiguous"
  | "manual-search"
  | "deleted";

export interface TelemetryCorrection {
  originalName: string;
  matcherChoice: string;
  userChoice: string | null;
  correctionType: CorrectionType;
}

export interface TelemetryEvent {
  requestId: string;
  userId: string;
  action: "commit" | "abandon";
  itemsTotal: number;
  itemsCommitted: number;
  itemsDeleted: number;
  itemsWithEditedFood: number;
  itemsWithEditedTime: number;
  itemsWithEditedQty: number;
  corrections: TelemetryCorrection[];
  llmLatencyMs: number;
  matcherLatencyMs: number;
  reviewDurationMs: number;
}

let mkdirDone = false;
let writeQueue: Promise<void> = Promise.resolve();

async function ensureDir(): Promise<void> {
  if (mkdirDone) return;
  await mkdir(LOG_DIR, { recursive: true });
  mkdirDone = true;
}

function logPathForToday(): string {
  const date = new Date().toISOString().slice(0, 10);
  return resolve(LOG_DIR, `${date}.jsonl`);
}

export function logTelemetryEvent(event: TelemetryEvent): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...event }) + "\n";
  const path = logPathForToday();
  writeQueue = writeQueue
    .then(ensureDir)
    .then(() => appendFile(path, line, "utf-8"))
    .catch((err) => {
      console.warn("telemetry-log write failed:", err);
    });
}
