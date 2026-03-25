import type { FastifyInstance } from "fastify";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../../../triplit/.data/sqlite/app.db");

// Collections where ALL records are system data
const UNFILTERED = ["nutrients", "foodNutrients"] as const;
// Collections where system data has userId = "__system__"
const FILTERED = ["foods", "foodPortions", "dailyNorms"] as const;

/**
 * Read system-entity counts directly from Triplit's SQLite file.
 *
 * ⚠️  Relies on Triplit's internal storage format (@triplit/client ^1.0.50):
 *   table : "data"
 *   key   : `fdata\x01f<collection>\x01<id>`
 *   value : JSON string of the record
 *
 * If counts suddenly return 0 after a Triplit upgrade, check whether
 * the key prefix format or table name has changed.
 */
export function querySystemCounts(db: Database.Database): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const name of UNFILTERED) {
    const prefix = `fdata\x01f${name}\x01`;
    const row = db.prepare(
      "SELECT COUNT(*) as c FROM data WHERE key >= ? AND key < ?",
    ).get(prefix, prefix + "\xFF") as { c: number };
    counts[name] = row.c;
  }

  for (const name of FILTERED) {
    const prefix = `fdata\x01f${name}\x01`;
    const row = db.prepare(
      `SELECT COUNT(*) as c FROM data
       WHERE key >= ? AND key < ?
       AND json_extract(value, '$.userId') = '__system__'`,
    ).get(prefix, prefix + "\xFF") as { c: number };
    counts[name] = row.c;
  }

  return counts;
}

export async function systemRoutes(app: FastifyInstance) {
  /**
   * Stream USDA foodNutrients as ndjson, grouped by foodId (KV format).
   * Each line: {"foodId":"...","nutrients":{"protein":1.5,"fat":0.3,...}}
   * ~9K lines instead of ~450K — much faster bulk load on the client.
   */
  app.get("/export/food-nutrients", async (_req, reply) => {
    let db: Database.Database | null = null;
    try {
      db = new Database(DB_PATH, { readonly: true });
      const prefix = `fdata\x01ffoodNutrients\x01`;
      const rows = db
        .prepare("SELECT value FROM data WHERE key >= ? AND key < ?")
        .all(prefix, prefix + "\xFF") as { value: string }[];

      // Group by foodId: { foodId → { nutrientId: quantity } }
      const grouped = new Map<string, Record<string, number>>();
      for (const row of rows) {
        const record = JSON.parse(row.value) as { foodId: string; nutrientId: string; quantity: number };
        let nutrients = grouped.get(record.foodId);
        if (!nutrients) {
          nutrients = {};
          grouped.set(record.foodId, nutrients);
        }
        nutrients[record.nutrientId] = record.quantity;
      }

      reply.header("Content-Type", "application/x-ndjson");
      const lines: string[] = [];
      for (const [foodId, nutrients] of grouped) {
        lines.push(JSON.stringify({ foodId, nutrients }));
      }
      return reply.send(lines.join("\n"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      app.log.error(`[system/export/food-nutrients] ${msg}`);
      return reply.status(500).send({ error: msg });
    } finally {
      db?.close();
    }
  });

  app.get("/counts", async (_req, reply) => {
    let db: Database.Database | null = null;
    try {
      db = new Database(DB_PATH, { readonly: true });
      return reply.send(querySystemCounts(db));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      app.log.error(`[system/counts] ${msg}`);
      return reply.status(500).send({ error: msg });
    } finally {
      db?.close();
    }
  });

  // Lightweight version check — single number, sum of all system collection counts.
  // Clients store this in localStorage; if it matches, no sync is needed on startup.
  app.get("/version", async (_req, reply) => {
    let db: Database.Database | null = null;
    try {
      db = new Database(DB_PATH, { readonly: true });
      const counts = querySystemCounts(db);
      const version = Object.values(counts).reduce((a, b) => a + b, 0);
      return reply.send({ version });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      app.log.error(`[system/version] ${msg}`);
      return reply.status(500).send({ error: msg });
    } finally {
      db?.close();
    }
  });
}
