import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import {
  createTestUser,
  type TestUser,
} from "../../../test/auth-helpers.js";
import {
  makeTestPool,
  truncateAllUserData,
} from "../../../test/db-helpers.js";

// Snapshot round-trip (B2.2 — own-auth rewrite).
//
// Push N products via /api/backup, then GET /api/backup/snapshot, assert
// every pushed id comes back with right edit_count + jsonb shape preserved.
// Same auth/DB pattern as backup.test.ts (real bearer + TEST_DATABASE_URL).

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

let app: FastifyInstance;
let pool: ReturnType<typeof makeTestPool>;

beforeAll(async () => {
  if (!ready) return;
  const { backupRoutes } = await import("../backup.js");
  app = Fastify({ logger: false });
  await app.register(backupRoutes, { prefix: "/api/backup" });
  await app.ready();
  pool = makeTestPool();
});

afterAll(async () => {
  if (!ready) return;
  await app?.close();
  await pool?.end();
});

describeIfReady("snapshot round-trip", () => {
  let user: TestUser;

  beforeEach(async () => {
    await truncateAllUserData(pool);
    user = await createTestUser();
  });

  it(
    "push N → snapshot returns every pushed row with right edit_count",
    async () => {
      const N = 25;
      const now = new Date().toISOString();
      const rows = Array.from({ length: N }, (_, i) => ({
        table: "products",
        id: crypto.randomUUID(),
        user_id: user.userId,
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
      }));

      const push = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: user.headers,
        payload: { rows },
      });
      expect(push.statusCode).toBe(200);
      const pushBody = push.json() as {
        accepted: Array<{ id: string }>;
        rejected: unknown[];
      };
      expect(pushBody.rejected).toEqual([]);
      expect(pushBody.accepted).toHaveLength(N);

      const snap = await app.inject({
        method: "GET",
        url: "/api/backup/snapshot",
        headers: user.headers,
      });
      expect(snap.statusCode).toBe(200);
      const snapBody = snap.json() as Record<
        string,
        Array<Record<string, unknown>>
      >;
      expect(snapBody.products, "snapshot must have products key").toBeDefined();

      const byId = new Map(
        snapBody.products.map((r) => [r.id as string, r]),
      );
      for (const r of rows) {
        const got = byId.get(r.id as string);
        expect(got, `snapshot missing pushed row ${r.id}`).toBeTruthy();
        expect(got!.name).toBe(r.name);
        expect(got!.edit_count).toBe(r.edit_count);
        expect(got!.user_id).toBe(user.userId);
        // jsonb round-trip: nutrients/portions/categories should be parsed objects.
        expect(got!.nutrients).toEqual(r.nutrients);
        expect(got!.portions).toEqual(r.portions);
        expect(got!.categories).toEqual(r.categories);
      }
    },
    60_000,
  );
});

if (!ready) {
  describe("snapshot round-trip", () => {
    it.skip(
      "TEST_DATABASE_URL not set — see .env in apps/disher-backend-3.0",
      () => {},
    );
  });
}
