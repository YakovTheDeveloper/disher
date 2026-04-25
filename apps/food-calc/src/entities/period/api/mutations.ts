import { db } from "@/powersync/database";
import { supabase } from "@/powersync/supabase-client";

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export async function addPeriod(params: {
  name: string;
  colorIndex: number;
  fontFamily?: string;
  fontSize?: number;
}): Promise<string> {
  const id = crypto.randomUUID();
  const userId = await currentUserId();
  const now = new Date().toISOString();
  await db.execute(
    `insert into periods (id, user_id, name, color_index, font_family, font_size, created_at)
     values (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      params.name.trim(),
      params.colorIndex,
      params.fontFamily ?? "sans",
      params.fontSize ?? 16,
      now,
    ],
  );
  return id;
}

export async function removePeriod(id: string): Promise<void> {
  await db.execute(
    `update periods set deleted_at = ? where id = ?`,
    [new Date().toISOString(), id],
  );
}

export async function updatePeriod(
  id: string,
  updates: Partial<{
    name: string;
    colorIndex: number;
    fontFamily: string;
    fontSize: number;
  }>,
): Promise<void> {
  const COLUMN_MAP: Record<string, string> = {
    name: "name",
    colorIndex: "color_index",
    fontFamily: "font_family",
    fontSize: "font_size",
  };
  const keys = Object.keys(updates) as (keyof typeof updates)[];
  if (keys.length === 0) return;
  const setClauses = keys.map((k) => `${COLUMN_MAP[k]} = ?`).join(", ");
  const values = keys.map((k) => updates[k]);
  await db.execute(
    `update periods set ${setClauses}, updated_at = ? where id = ?`,
    [...values, new Date().toISOString(), id],
  );
}
