import { enqueue, drain } from "@/shared/lib/storage/pendingWrites";
import { queryClient } from "@/shared/lib/storage/queryClient";
import { getUserIdSync } from "@/shared/lib/auth/useUserId";
import type { DailyNorm, DailyNormItems } from "../model/types";

const TABLE = "daily_norms";

function requireUserId(): string {
  const userId = getUserIdSync();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

function invalidateDailyNorms() {
  void queryClient.invalidateQueries({ queryKey: ["daily_norms"] });
}

function patchDailyNormsCache(updater: (rows: DailyNorm[]) => DailyNorm[]) {
  queryClient.setQueriesData<DailyNorm[]>(
    { queryKey: ["daily_norms", "all"] },
    (old) => (old ? updater(old) : old),
  );
}

function safeParseItems(json: string | undefined): DailyNormItems {
  if (!json) return {};
  try {
    return JSON.parse(json) as DailyNormItems;
  } catch {
    return {};
  }
}

export async function createDailyNorm(
  name: string,
  description: string,
  items?: DailyNormItems,
): Promise<string> {
  const id = crypto.randomUUID();
  const userId = requireUserId();
  const now = new Date().toISOString();
  const itemsObj = items ?? {};

  const row = {
    id,
    user_id: userId,
    name,
    description,
    items: itemsObj,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  const optimistic: DailyNorm = {
    id,
    userId,
    name,
    description,
    items: JSON.stringify(itemsObj),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  patchDailyNormsCache((rows) => [...rows, optimistic]);

  await enqueue({ table: TABLE, op: "insert", payload: row });
  void drain();
  invalidateDailyNorms();
  return id;
}

type DailyNormUpdates = Partial<{
  name: string;
  description: string;
  items: string; // serialized JSON; converted to object before enqueue.
}>;

export async function updateDailyNorm(
  normId: string,
  updates: DailyNormUpdates,
): Promise<void> {
  const keys = Object.keys(updates) as (keyof DailyNormUpdates)[];
  if (keys.length === 0) return;

  const now = new Date().toISOString();
  patchDailyNormsCache((rows) =>
    rows.map((n) => {
      if (n.id !== normId) return n;
      const next: DailyNorm = { ...n };
      for (const k of keys) {
        if (k === "name") next.name = updates.name as string;
        else if (k === "description") next.description = updates.description as string;
        else if (k === "items") next.items = updates.items as string;
      }
      next.updatedAt = now;
      return next;
    }),
  );

  const payload: Record<string, unknown> = { id: normId, updated_at: now };
  for (const k of keys) {
    if (k === "items") payload.items = safeParseItems(updates.items);
    else payload[k] = updates[k];
  }

  await enqueue({ table: TABLE, op: "upsert", payload });
  void drain();
  invalidateDailyNorms();
}

export async function deleteDailyNorm(normId: string): Promise<void> {
  patchDailyNormsCache((rows) => rows.filter((n) => n.id !== normId));
  await enqueue({ table: TABLE, op: "delete", payload: { id: normId } });
  void drain();
  invalidateDailyNorms();
}

export async function setDailyNormNutrient(
  normId: string,
  nutrientId: string,
  quantity: number | null,
  currentItems: DailyNormItems,
): Promise<void> {
  const next = { ...currentItems };
  if (quantity === null || quantity === 0) {
    delete next[nutrientId];
  } else {
    next[nutrientId] = quantity;
  }
  await updateDailyNorm(normId, { items: JSON.stringify(next) });
}
