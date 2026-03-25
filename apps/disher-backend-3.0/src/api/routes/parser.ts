import type { FastifyInstance } from "fastify";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REVIEW_PATH = path.resolve(__dirname, "../../../parser/output/usda-review.json");
const OVERRIDES_PATH = path.resolve(
  __dirname,
  "../../../parser/usda/CURRENT_TASK_FILTERING/manual-overrides.json",
);
const V2_PATH = path.resolve(__dirname, "../../../parser/output/usda-foods-v2.json");
const COMBINED_PATH = path.resolve(__dirname, "../../../parser/output/combined-foods.json");

interface V2Food {
  id: string;
  nameEng: string;
  nameRu: string;
  source: string;
  categories: string[];
  nutrients: Array<{ nutrientId: string; quantity: number }>;
  portions?: Array<{ label: string; amount: number; unit: string; grams: number }>;
}

interface V2File {
  meta: Record<string, unknown>;
  foods: V2Food[];
}

function readJSON(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) return {};
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

function readV2(): V2File {
  if (!existsSync(V2_PATH)) return { meta: {}, foods: [] };
  return JSON.parse(readFileSync(V2_PATH, "utf-8")) as V2File;
}

export async function parserRoutes(app: FastifyInstance) {
  // ── v2: usda-foods-v2.json CRUD ───────────────────────────────────────────

  // GET /v2/foods — list all foods (id + names only, no nutrients)
  app.get("/v2/foods", async (_req, reply) => {
    const data = readV2();
    const list = data.foods.map(({ id, nameEng, nameRu }) => ({ id, nameEng, nameRu }));
    return reply.send({ meta: data.meta, foods: list });
  });

  // DELETE /v2/foods/:id — remove a food from usda-foods-v2.json
  app.delete<{ Params: { id: string } }>("/v2/foods/:id", async (req, reply) => {
    const { id } = req.params;
    const data = readV2();
    const before = data.foods.length;
    data.foods = data.foods.filter((f) => f.id !== id);
    if (data.foods.length === before) {
      return reply.status(404).send({ error: "not found" });
    }
    (data.meta as Record<string, unknown>).totalFoods = data.foods.length;
    writeFileSync(V2_PATH, JSON.stringify(data, null, 2), "utf-8");
    return reply.send({ deleted: id, remaining: data.foods.length });
  });

  // ── combined-foods.json CRUD ──────────────────────────────────────────────

  function readCombined(): V2File {
    if (!existsSync(COMBINED_PATH)) return { meta: {}, foods: [] };
    return JSON.parse(readFileSync(COMBINED_PATH, "utf-8")) as V2File;
  }

  function writeCombined(data: V2File) {
    writeFileSync(COMBINED_PATH, JSON.stringify(data, null, 2), "utf-8");
  }

  // GET /combined/foods — list all (id + names + source + categories)
  app.get("/combined/foods", async (_req, reply) => {
    const data = readCombined();
    const list = data.foods.map(({ id, nameEng, nameRu, source, categories }) => ({
      id, nameEng, nameRu, source, categories,
    }));
    return reply.send({ meta: data.meta, foods: list });
  });

  // DELETE /combined/foods/:id
  app.delete<{ Params: { id: string } }>("/combined/foods/:id", async (req, reply) => {
    const { id } = req.params;
    const data = readCombined();
    const before = data.foods.length;
    data.foods = data.foods.filter((f) => f.id !== id);
    if (data.foods.length === before) {
      return reply.status(404).send({ error: "not found" });
    }
    (data.meta as Record<string, unknown>).totalFoods = data.foods.length;
    writeCombined(data);
    return reply.send({ deleted: id, remaining: data.foods.length });
  });

  // PATCH /combined/foods/:id — update name fields
  app.patch<{
    Params: { id: string };
    Body: { nameRu?: string; nameEng?: string };
  }>("/combined/foods/:id", async (req, reply) => {
    const { id } = req.params;
    const { nameRu, nameEng } = req.body ?? {};
    const data = readCombined();
    const food = data.foods.find((f) => f.id === id);
    if (!food) return reply.status(404).send({ error: "not found" });
    if (nameRu !== undefined) food.nameRu = nameRu;
    if (nameEng !== undefined) food.nameEng = nameEng;
    writeCombined(data);
    return reply.send({ id, nameRu: food.nameRu, nameEng: food.nameEng });
  });

  // ── Legacy review UI ──────────────────────────────────────────────────────

  // GET all candidates for review UI
  app.get("/candidates", async (_req, reply) => {
    const data = readJSON(REVIEW_PATH);
    return reply.send(data);
  });

  // POST save overrides — writes to both manual-overrides.json AND usda-review.json
  app.post<{ Body: { overrides: Record<string, "Удалить" | "Оставить"> } }>(
    "/save",
    async (req, reply) => {
      const { overrides } = req.body ?? {};
      if (!overrides || typeof overrides !== "object") {
        return reply.status(400).send({ error: "invalid body" });
      }

      // 1. Merge into manual-overrides.json (cumulative history of manual decisions)
      const existing = readJSON(OVERRIDES_PATH) as Record<string, string>;
      const merged = { ...existing, ...overrides };
      writeFileSync(OVERRIDES_PATH, JSON.stringify(merged, null, 2), "utf-8");

      // 2. Apply to usda-review.json (the main data file)
      const data = readJSON(REVIEW_PATH) as Record<
        string,
        { status: string; reason: string; [k: string]: unknown }
      >;
      let changed = 0;

      for (const [id, newStatus] of Object.entries(overrides)) {
        if (data[id] && (newStatus === "Удалить" || newStatus === "Оставить")) {
          data[id].status = newStatus;
          data[id].reason =
            newStatus === "Удалить"
              ? "Ручной выбор (review)"
              : data[id].reason
                ? `Восстановлено: ${data[id].reason}`.slice(0, 100)
                : "";
          changed++;
        }
      }

      writeFileSync(REVIEW_PATH, JSON.stringify(data, null, 2), "utf-8");

      return reply.send({
        saved: changed,
        totalOverrides: Object.keys(merged).length,
      });
    },
  );
}
