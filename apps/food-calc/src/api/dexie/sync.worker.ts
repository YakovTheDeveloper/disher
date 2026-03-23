import { referenceDb, type DexieFoodNutrientKV } from "./client.js";

export type SyncWorkerMessage =
  | { type: "start"; url: string; timeoutMs: number }

export type SyncWorkerResponse =
  | { type: "progress"; count: number }
  | { type: "done"; total: number }
  | { type: "error"; message: string }

self.onmessage = async (e: MessageEvent<SyncWorkerMessage>) => {
  if (e.data.type !== "start") return;

  try {
    const res = await fetch(e.data.url, {
      signal: AbortSignal.timeout(e.data.timeoutMs),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    await referenceDb.foodNutrients.clear();

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const BATCH = 1_000;
    let batch: DexieFoodNutrientKV[] = [];
    let total = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop()!;
      for (const line of lines) {
        if (!line.trim()) continue;
        batch.push(JSON.parse(line) as DexieFoodNutrientKV);
        if (batch.length >= BATCH) {
          await referenceDb.foodNutrients.bulkPut(batch);
          total += batch.length;
          batch = [];
          self.postMessage({ type: "progress", count: total } satisfies SyncWorkerResponse);
        }
      }
    }
    if (buffer.trim()) batch.push(JSON.parse(buffer) as DexieFoodNutrientKV);
    if (batch.length) {
      await referenceDb.foodNutrients.bulkPut(batch);
      total += batch.length;
    }

    self.postMessage({ type: "done", total } satisfies SyncWorkerResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ type: "error", message } satisfies SyncWorkerResponse);
  }
};
