import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import pg from "pg";

// 8.6 Snapshot round-trip (P1).
//
// Push N random products to /api/backup, then GET /api/backup/snapshot,
// assert every pushed id is back in `products` with the right edit_count
// and field shape.
//
// Same auth-mock pattern as 8.3.

vi.mock("../../auth.js", () => ({
  verifyUser: vi.fn(async (req: any, reply: any) => {
    const uid = req.headers["x-test-user-id"];
    if (!uid) {
      reply.status(401).send({ error: "x-test-user-id missing in test" });
      return null;
    }
    return uid;
  }),
}));

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const TEST_USER_ID = process.env.TEST_USER_ID;
const ready = Boolean(SUPABASE_DB_URL && TEST_USER_ID);
const describeIfReady = ready ? describe : describe.skip;

let app: FastifyInstance;
let pool: pg.Pool;
const insertedIds: string[] = [];

beforeAll(async () => {
  if (!ready) return;
  const { backupRoutes } = await import("../backup.js");
  app = Fastify({ logger: false });
  await app.register(backupRoutes, { prefix: "/api/backup" });
  await app.ready();
  pool = new pg.Pool({
    connectionString: SUPABASE_DB_URL,
    max: 2,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
  });
});

afterAll(async () => {
  if (!ready) return;
  if (insertedIds.length) {
    await pool.query("delete from public.products where id = any($1::uuid[])", [
      insertedIds,
    ]);
  }
  await app?.close();
  await pool?.end();
});

describeIfReady("snapshot round-trip", () => {
  it("push N → snapshot returns every pushed row with right edit_count", async () => {
    const N = 25;
    const now = new Date().toISOString();
    const rows = Array.from({ length: N }, (_, i) => {
      const id = crypto.randomUUID();
      insertedIds.push(id);
      return {
        table: "products",
        id,
        user_id: TEST_USER_ID,
        name: `_test_snap_${i}`,
        name_eng: "",
        description: "",
        description_eng: "",
        source: "",
        price_per_kg: i,
        nutrients: { kcal: i * 10 },
        portions: [{ l: "p", g: 100 }],
        categories: ["test"],
        edit_count: 1,
        client_modified_at: now,
        created_at: now,
        deleted_at: null,
      };
    });

    const headers = {
      authorization: "Bearer test",
      "x-test-user-id": TEST_USER_ID!,
    };

    const push = await app.inject({
      method: "POST",
      url: "/api/backup",
      headers,
      payload: { rows },
    });
    expect(push.statusCode).toBe(200);
    const pushBody = push.json() as { accepted: Array<{ id: string }>; rejected: unknown[] };
    expect(pushBody.rejected).toEqual([]);
    expect(pushBody.accepted).toHaveLength(N);

    const snap = await app.inject({
      method: "GET",
      url: "/api/backup/snapshot",
      headers,
    });
    expect(snap.statusCode).toBe(200);
    const snapBody = snap.json() as Record<string, Array<Record<string, unknown>>>;
    expect(snapBody.products, "snapshot must have products key").toBeDefined();

    const byId = new Map(
      snapBody.products.map((r) => [r.id as string, r]),
    );
    for (const r of rows) {
      const got = byId.get(r.id as string);
      expect(got, `snapshot missing pushed row ${r.id}`).toBeTruthy();
      expect(got!.name).toBe(r.name);
      expect(got!.edit_count).toBe(r.edit_count);
      expect(got!.user_id).toBe(TEST_USER_ID);
      // jsonb round-trip: nutrients/portions/categories should be parsed objects.
      expect(got!.nutrients).toEqual(r.nutrients);
      expect(got!.portions).toEqual(r.portions);
      expect(got!.categories).toEqual(r.categories);
    }
  }, 60_000);
});

if (!ready) {
  describe("snapshot round-trip", () => {
    it.skip(
      "SUPABASE_DB_URL or TEST_USER_ID not set — see .env in apps/disher-backend-3.0",
      () => {},
    );
  });
}
