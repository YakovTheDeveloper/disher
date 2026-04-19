import { appendFile, mkdir } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = resolve(__dirname, "../../logs");

export interface LLMOutputLogItem {
  type?: "product" | "dish";
  name: string;
  note?: string;
  quantity: number | null;
  time: string | null;
}

export interface LLMOutputLogEntry {
  ts: string;
  requestId: string;
  model: string;
  phrase: string;
  itemsReturned: LLMOutputLogItem[];
  cached: boolean;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalCost?: number;
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
  return resolve(LOG_DIR, `llm-output-${date}.jsonl`);
}

export function logLLMOutput(entry: Omit<LLMOutputLogEntry, "ts">): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n";
  const path = logPathForToday();
  writeQueue = writeQueue
    .then(ensureDir)
    .then(() => appendFile(path, line, "utf-8"))
    .catch((err) => {
      console.warn("llm-output-log write failed:", err);
    });
}
