import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { querySystemCounts } from "./system.js";

// ─── Triplit internal key format (@triplit/client ^1.0.50) ───────────────────
// If these tests break after a Triplit upgrade, the storage format has changed.
// Check Triplit changelog for "storage" or "sqlite" related changes.

function triplitKey(collection: string, id: string): string {
  return `fdata\x01f${collection}\x01${id}`;
}

function makeDb(): Database.Database {
  const db = new Database(":memory:");
  db.exec("CREATE TABLE data (key TEXT PRIMARY KEY, value TEXT)");
  return db;
}

function insert(db: Database.Database, collection: string, id: string, record: object) {
  db.prepare("INSERT INTO data (key, value) VALUES (?, ?)").run(
    triplitKey(collection, id),
    JSON.stringify(record),
  );
}

describe("querySystemCounts — Triplit SQLite key format", () => {
  let db: Database.Database;

  beforeEach(() => { db = makeDb(); });
  afterEach(() => { db.close(); });

  it("counts unfiltered collections (nutrients, foodNutrients) without userId filter", () => {
    insert(db, "nutrients", "n1", { name: "Protein" });
    insert(db, "nutrients", "n2", { name: "Fat" });
    insert(db, "foodNutrients", "fn1", { foodId: "f1", nutrientId: "n1", quantity: 10 });

    const counts = querySystemCounts(db);

    expect(counts.nutrients).toBe(2);
    expect(counts.foodNutrients).toBe(1);
  });

  it("counts only __system__ records in filtered collections (foods, foodPortions, dailyNorms)", () => {
    insert(db, "foods", "sys1", { userId: "__system__", name: "Apple" });
    insert(db, "foods", "sys2", { userId: "__system__", name: "Banana" });
    insert(db, "foods", "usr1", { userId: "user-abc", name: "My Food" });

    insert(db, "foodPortions", "fp1", { userId: "__system__", foodId: "sys1", label: "piece" });
    insert(db, "foodPortions", "fp2", { userId: "user-abc", foodId: "usr1", label: "cup" });

    insert(db, "dailyNorms", "dn1", { userId: "__system__", name: "Default", items: {} });

    const counts = querySystemCounts(db);

    expect(counts.foods).toBe(2);
    expect(counts.foodPortions).toBe(1);
    expect(counts.dailyNorms).toBe(1);
  });

  it("returns 0 for empty collections", () => {
    const counts = querySystemCounts(db);

    expect(counts.nutrients).toBe(0);
    expect(counts.foodNutrients).toBe(0);
    expect(counts.foods).toBe(0);
    expect(counts.foodPortions).toBe(0);
    expect(counts.dailyNorms).toBe(0);
  });

  it("key prefix does not bleed into adjacent collections", () => {
    // "foods" prefix must not match "foodNutrients" or "foodPortions"
    insert(db, "foods", "s1", { userId: "__system__" });
    insert(db, "foodNutrients", "fn1", {});
    insert(db, "foodPortions", "fp1", { userId: "__system__" });

    const counts = querySystemCounts(db);

    expect(counts.foods).toBe(1);
    expect(counts.foodNutrients).toBe(1);
    expect(counts.foodPortions).toBe(1);
  });
});
