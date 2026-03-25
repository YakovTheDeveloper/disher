/**
 * Migration script: converts existing Triplit SQLite data in-place.
 *
 * 1. foods.nutrients:  [{nutrientId, quantity}]  → Record<string, number>
 * 2. foods.portions:   [{label, amount, unit, grams}] → [{l, g}]
 * 3. dishes.portions:  collect from dishPortions collection → [{l, g}] embedded in dish
 * 4. Delete all dishPortions records
 *
 * Usage:
 *   Stop Triplit server first, then:
 *   npx tsx scripts/migrate-inline.ts
 *
 * ⚠️  Modifies app.db directly. Back up before running.
 */

import Database from "better-sqlite3";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, "../triplit/.data/sqlite/app.db");

const db = new Database(DB_PATH);

// ─── Helpers ───

function getAllRecords(collection: string): Array<{ key: string; value: Record<string, unknown> }> {
  const prefix = `fdata\x01f${collection}\x01`;
  const rows = db.prepare(
    `SELECT key, value FROM data WHERE key >= ? AND key < ?`,
  ).all(prefix, prefix + "\xFF") as Array<{ key: string; value: string }>;

  return rows.map((row) => ({
    key: row.key,
    value: JSON.parse(row.value),
  }));
}

function updateRecord(key: string, value: Record<string, unknown>) {
  db.prepare(`UPDATE data SET value = ? WHERE key = ?`).run(
    JSON.stringify(value),
    key,
  );
}

function deleteRecord(key: string) {
  db.prepare(`DELETE FROM data WHERE key = ?`).run(key);
}

// ─── 1. Migrate foods.nutrients ───

function migrateFoodNutrients() {
  const foods = getAllRecords("foods");
  let converted = 0;
  let alreadyOk = 0;

  for (const { key, value } of foods) {
    const nutrients = value.nutrients;

    // Already in Record format
    if (nutrients && !Array.isArray(nutrients) && typeof nutrients === "object") {
      alreadyOk++;
      continue;
    }

    // Convert array format → Record
    if (Array.isArray(nutrients)) {
      const map: Record<string, number> = {};
      for (const entry of nutrients) {
        const id = entry.nutrientId ?? entry.id;
        const qty = entry.quantity ?? entry.amount;
        if (id != null && qty != null && qty !== 0) {
          map[String(id)] = qty;
        }
      }
      value.nutrients = map;
      updateRecord(key, value);
      converted++;
    } else {
      // null/undefined → empty object
      value.nutrients = {};
      updateRecord(key, value);
      converted++;
    }
  }

  console.log(`  foods.nutrients: ${converted} converted, ${alreadyOk} already ok (${foods.length} total)`);
}

// ─── 2. Migrate foods.portions ───

function migrateFoodPortions() {
  const foods = getAllRecords("foods");
  let converted = 0;
  let alreadyOk = 0;

  for (const { key, value } of foods) {
    const portions = value.portions;

    if (!Array.isArray(portions) || portions.length === 0) {
      alreadyOk++;
      continue;
    }

    // Check if already in {l, g} format
    const first = portions[0];
    if (first && "l" in first && "g" in first && !("label" in first)) {
      alreadyOk++;
      continue;
    }

    // Convert {label, amount, unit, grams} → {l, g}
    const compact = portions
      .filter((p: Record<string, unknown>) => {
        const g = p.grams ?? p.g;
        return g != null && Number(g) > 0;
      })
      .map((p: Record<string, unknown>) => ({
        l: String(p.label ?? p.l ?? ""),
        g: Math.round(Number(p.grams ?? p.g) * 100) / 100,
      }));

    value.portions = compact;
    updateRecord(key, value);
    converted++;
  }

  console.log(`  foods.portions: ${converted} converted, ${alreadyOk} already ok (${foods.length} total)`);
}

// ─── 3. Migrate dishPortions → dishes.portions ───

function migrateDishPortions() {
  const dishPortionRecords = getAllRecords("dishPortions");

  if (dishPortionRecords.length === 0) {
    console.log("  dishPortions: no records to migrate");
    return;
  }

  // Group by dishId
  const byDish = new Map<string, Array<{ l: string; g: number }>>();
  for (const { value } of dishPortionRecords) {
    const dishId = String(value.dishId);
    if (!byDish.has(dishId)) byDish.set(dishId, []);
    byDish.get(dishId)!.push({
      l: String(value.label ?? ""),
      g: Math.round(Number(value.grams ?? 0) * 100) / 100,
    });
  }

  // Update each dish with embedded portions
  const dishes = getAllRecords("dishes");
  let updated = 0;

  for (const { key, value } of dishes) {
    const dishId = String(value.id);
    const portions = byDish.get(dishId);
    if (!portions || portions.length === 0) {
      // Ensure dishes have portions field
      if (!value.portions) {
        value.portions = [];
        updateRecord(key, value);
      }
      continue;
    }

    value.portions = portions;
    updateRecord(key, value);
    updated++;
  }

  // Delete all dishPortions records
  for (const { key } of dishPortionRecords) {
    deleteRecord(key);
  }

  console.log(`  dishes.portions: ${updated} dishes updated from ${dishPortionRecords.length} dishPortion records`);
  console.log(`  dishPortions: ${dishPortionRecords.length} records deleted`);
}

// ─── Main ───

function main() {
  console.log("=== Inline Migration ===\n");
  console.log(`Database: ${DB_PATH}\n`);

  // Verify DB exists and has data
  const count = db.prepare(`SELECT COUNT(*) as c FROM data`).get() as { c: number };
  console.log(`Total records in DB: ${count.c}\n`);

  console.log("Migrating...");
  migrateFoodNutrients();
  migrateFoodPortions();
  migrateDishPortions();

  console.log("\n=== Migration complete ===");
  db.close();
}

main();
