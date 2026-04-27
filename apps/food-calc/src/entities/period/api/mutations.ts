import { enqueue, drain } from "@/shared/lib/storage/pendingWrites";
import { queryClient } from "@/shared/lib/storage/queryClient";
import { getUserIdSync } from "@/shared/lib/auth/useUserId";
import type { Period } from "./queries";

const TABLE = "periods";

function requireUserId(): string {
  const userId = getUserIdSync();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

function invalidatePeriods() {
  void queryClient.invalidateQueries({ queryKey: ["periods"] });
}

function patchPeriodsCache(updater: (rows: Period[]) => Period[]) {
  queryClient.setQueriesData<Period[]>(
    { queryKey: ["periods", "all"] },
    (old) => (old ? updater(old) : old),
  );
}

export async function addPeriod(params: {
  name: string;
  colorIndex: number;
  fontFamily?: string;
  fontSize?: number;
}): Promise<string> {
  const id = crypto.randomUUID();
  const userId = requireUserId();
  const now = new Date().toISOString();

  const name = params.name.trim();
  const fontFamily = params.fontFamily ?? "sans";
  const fontSize = params.fontSize ?? 16;

  const row = {
    id,
    user_id: userId,
    name,
    color_index: params.colorIndex,
    font_family: fontFamily,
    font_size: fontSize,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  const optimistic: Period = {
    id,
    userId,
    name,
    colorIndex: params.colorIndex,
    fontFamily,
    fontSize,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  patchPeriodsCache((rows) => [...rows, optimistic]);

  await enqueue({ table: TABLE, op: "insert", payload: row });
  void drain();
  invalidatePeriods();
  return id;
}

export async function removePeriod(id: string): Promise<void> {
  patchPeriodsCache((rows) => rows.filter((p) => p.id !== id));
  await enqueue({ table: TABLE, op: "delete", payload: { id } });
  void drain();
  invalidatePeriods();
}

type PeriodUpdates = Partial<{
  name: string;
  colorIndex: number;
  fontFamily: string;
  fontSize: number;
}>;

const COLUMN_MAP: Record<keyof PeriodUpdates, string> = {
  name: "name",
  colorIndex: "color_index",
  fontFamily: "font_family",
  fontSize: "font_size",
};

export async function updatePeriod(
  id: string,
  updates: PeriodUpdates,
): Promise<void> {
  const keys = Object.keys(updates) as (keyof PeriodUpdates)[];
  if (keys.length === 0) return;

  const now = new Date().toISOString();
  patchPeriodsCache((rows) =>
    rows.map((p) => {
      if (p.id !== id) return p;
      const next: Period = { ...p };
      for (const k of keys) {
        if (k === "name") next.name = updates.name as string;
        else if (k === "colorIndex") next.colorIndex = updates.colorIndex as number;
        else if (k === "fontFamily") next.fontFamily = updates.fontFamily as string;
        else if (k === "fontSize") next.fontSize = updates.fontSize as number;
      }
      next.updatedAt = now;
      return next;
    }),
  );

  const payload: Record<string, unknown> = { id, updated_at: now };
  for (const k of keys) {
    payload[COLUMN_MAP[k]] = updates[k];
  }

  await enqueue({ table: TABLE, op: "upsert", payload });
  void drain();
  invalidatePeriods();
}
