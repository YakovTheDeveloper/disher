import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { createTestUser, type TestUser } from "../../../test/auth-helpers.js";
import { makeTestPool, truncateAllUserData } from "../../../test/db-helpers.js";
import { WELCOME_GRANT_KOP } from "../../../billing/prices.js";

// Admin-route contract — bare Fastify with ONLY adminRoutes registered (no
// global error handler), mirroring balance-read.test.ts. Exercises the guard
// (401/403, role-admin vs env-admin) and the topup validation/idempotency
// matrix against a real Postgres. Skips when TEST_DATABASE_URL is unset.

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

let app: FastifyInstance;
let pool: ReturnType<typeof makeTestPool>;

async function promoteToAdmin(userId: string): Promise<void> {
  await pool.query(`update "users" set role = 'admin' where id = $1`, [userId]);
}

beforeAll(async () => {
  if (!ready) return;
  const { adminRoutes } = await import("../admin.js");
  app = Fastify({ logger: false });
  await app.register(adminRoutes, { prefix: "/api/admin" });
  await app.ready();
  pool = makeTestPool();
});

afterAll(async () => {
  if (!ready) return;
  await app?.close();
  await pool?.end();
});

describeIfReady("admin routes", () => {
  const savedAdminIds = process.env.ADMIN_USER_IDS;

  beforeEach(async () => {
    await truncateAllUserData(pool);
    delete process.env.ADMIN_USER_IDS;
  });

  afterEach(() => {
    // Restore the env every case tweaked it (env-admin test).
    if (savedAdminIds === undefined) delete process.env.ADMIN_USER_IDS;
    else process.env.ADMIN_USER_IDS = savedAdminIds;
  });

  // ── guard ────────────────────────────────────────────────────────────────
  it("401 without a session cookie", async () => {
    const res = await app.inject({ method: "GET", url: "/api/admin/me" });
    expect(res.statusCode).toBe(401);
  });

  it("403 for an authenticated non-admin", async () => {
    const user = await createTestUser();
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/me",
      headers: user.headers,
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ error: "Forbidden" });
  });

  it("200 for a role='admin' user (DB branch)", async () => {
    const admin = await createTestUser();
    await promoteToAdmin(admin.userId);
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/me",
      headers: admin.headers,
    });
    expect(res.statusCode).toBe(200);
  });

  it("200 for an ADMIN_USER_IDS env admin (role stays 'user')", async () => {
    const admin = await createTestUser();
    process.env.ADMIN_USER_IDS = `${admin.userId}`;
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/me",
      headers: admin.headers,
    });
    expect(res.statusCode).toBe(200);
  });

  // ── GET /users ─────────────────────────────────────────────────────────────
  it("GET /users lists users with balances", async () => {
    const admin = await createTestUser();
    await promoteToAdmin(admin.userId);
    const target = await createTestUser();

    const res = await app.inject({
      method: "GET",
      url: "/api/admin/users",
      headers: admin.headers,
    });
    expect(res.statusCode).toBe(200);
    const { items } = res.json() as {
      items: Array<{ id: string; email: string; balanceKop: number; hasWallet: boolean }>;
    };
    const row = items.find((i) => i.id === target.userId);
    expect(row).toBeTruthy();
    // No wallet touched yet → balance 0, hasWallet false.
    expect(row?.balanceKop).toBe(0);
    expect(row?.hasWallet).toBe(false);
  });

  // ── POST topup ─────────────────────────────────────────────────────────────
  it("topup credits welcome + amount for a user without a wallet", async () => {
    const admin = await createTestUser();
    await promoteToAdmin(admin.userId);
    const target = await createTestUser();

    const res = await app.inject({
      method: "POST",
      url: `/api/admin/users/${target.userId}/topup`,
      headers: admin.headers,
      payload: { amountKop: 500, reason: "test topup", requestId: "rq-1" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      balanceKop: WELCOME_GRANT_KOP + 500,
      alreadyApplied: false,
    });
  });

  it("topup is idempotent — same requestId credits once", async () => {
    const admin = await createTestUser();
    await promoteToAdmin(admin.userId);
    const target = await createTestUser();

    const first = await app.inject({
      method: "POST",
      url: `/api/admin/users/${target.userId}/topup`,
      headers: admin.headers,
      payload: { amountKop: 500, reason: "dup", requestId: "rq-dup" },
    });
    const second = await app.inject({
      method: "POST",
      url: `/api/admin/users/${target.userId}/topup`,
      headers: admin.headers,
      payload: { amountKop: 500, reason: "dup", requestId: "rq-dup" },
    });

    expect(first.json()).toMatchObject({ alreadyApplied: false });
    expect(second.json()).toMatchObject({
      alreadyApplied: true,
      balanceKop: WELCOME_GRANT_KOP + 500,
    });
  });

  it("404 for a valid uuid that isn't a user", async () => {
    const admin = await createTestUser();
    await promoteToAdmin(admin.userId);
    const res = await app.inject({
      method: "POST",
      url: `/api/admin/users/11111111-2222-3333-4444-555555555555/topup`,
      headers: admin.headers,
      payload: { amountKop: 500, reason: "x", requestId: "rq-404" },
    });
    expect(res.statusCode).toBe(404);
  });

  it("400 matrix — bad id/amount/reason/requestId are rejected before crediting", async () => {
    const admin = await createTestUser();
    await promoteToAdmin(admin.userId);
    const target = await createTestUser();
    const url = `/api/admin/users/${target.userId}/topup`;

    // non-uuid id → 400 before any SQL (would be pg 22P02 → 500 otherwise)
    const badId = await app.inject({
      method: "POST",
      url: "/api/admin/users/not-a-uuid/topup",
      headers: admin.headers,
      payload: { amountKop: 500, reason: "x", requestId: "r" },
    });
    expect(badId.statusCode).toBe(400);

    const cases: Array<Record<string, unknown>> = [
      { amountKop: 0, reason: "x", requestId: "r" },
      { amountKop: -1, reason: "x", requestId: "r" },
      { amountKop: 1.5, reason: "x", requestId: "r" },
      { amountKop: "500", reason: "x", requestId: "r" },
      { amountKop: 500, reason: "   ", requestId: "r" },
      { amountKop: 500, reason: "x", requestId: "" },
      { amountKop: 500, reason: "x", requestId: "welcome" },
    ];
    for (const payload of cases) {
      const res = await app.inject({ method: "POST", url, headers: admin.headers, payload });
      expect(res.statusCode, JSON.stringify(payload)).toBe(400);
    }

    // Nothing was credited by the rejected requests.
    const ledgerRes = await app.inject({
      method: "GET",
      url: `/api/admin/users/${target.userId}/ledger`,
      headers: admin.headers,
    });
    const { items } = ledgerRes.json() as { items: Array<{ kind: string }> };
    // Only the welcome grant (from ensureWallet) may exist — no topup grants.
    expect(items.filter((i) => i.kind === "grant").length).toBeLessThanOrEqual(1);
  });

  // ── GET ledger ─────────────────────────────────────────────────────────────
  it("ledger exposes the grant with meta.reason", async () => {
    const admin = await createTestUser();
    await promoteToAdmin(admin.userId);
    const target = await createTestUser();

    await app.inject({
      method: "POST",
      url: `/api/admin/users/${target.userId}/topup`,
      headers: admin.headers,
      payload: { amountKop: 500, reason: "birthday", requestId: "rq-meta" },
    });

    const res = await app.inject({
      method: "GET",
      url: `/api/admin/users/${target.userId}/ledger`,
      headers: admin.headers,
    });
    expect(res.statusCode).toBe(200);
    const { items } = res.json() as {
      items: Array<{ kind: string; amountKop: number; meta: { reason?: string } }>;
    };
    const topup = items.find((i) => i.amountKop === 500);
    expect(topup?.meta?.reason).toBe("birthday");
  });

  // ── GET auth-events ────────────────────────────────────────────────────────
  // The rows themselves are written by the better-auth hooks (auth/auth-events.ts,
  // unit-tested there); here we only pin the READ contract the admin panel calls.
  describe("auth diagnostics", () => {
    async function seedEvent(row: {
      outcome: string;
      email: string;
      errorCode?: string;
    }): Promise<void> {
      await pool.query(
        `insert into auth_events (path, provider, outcome, status_code, error_code, email)
         values ('/sign-in/email', 'email', $1, $2, $3, $4)`,
        [
          row.outcome,
          row.outcome === "success" ? 200 : 401,
          row.errorCode ?? null,
          row.email,
        ],
      );
    }

    it("403 for a non-admin", async () => {
      const user = await createTestUser();
      const res = await app.inject({
        method: "GET",
        url: "/api/admin/auth-events",
        headers: user.headers,
      });
      expect(res.statusCode).toBe(403);
    });

    it("problems=1 hides the successful logins", async () => {
      const admin = await createTestUser();
      await promoteToAdmin(admin.userId);
      await seedEvent({ outcome: "success", email: "ok@example.com" });
      await seedEvent({
        outcome: "failure",
        email: "stuck@example.com",
        errorCode: "INVALID_EMAIL_OR_PASSWORD",
      });

      const res = await app.inject({
        method: "GET",
        url: "/api/admin/auth-events?problems=1",
        headers: admin.headers,
      });
      expect(res.statusCode).toBe(200);
      const { items } = res.json() as {
        items: Array<{ email: string; outcome: string; errorCode: string | null }>;
      };
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        email: "stuck@example.com",
        outcome: "failure",
        errorCode: "INVALID_EMAIL_OR_PASSWORD",
      });
    });

    it("q narrows to one user by email substring", async () => {
      const admin = await createTestUser();
      await promoteToAdmin(admin.userId);
      await seedEvent({ outcome: "failure", email: "stuck@example.com" });
      await seedEvent({ outcome: "failure", email: "someone-else@example.com" });

      const res = await app.inject({
        method: "GET",
        url: "/api/admin/auth-events?q=STUCK",
        headers: admin.headers,
      });
      const { items } = res.json() as { items: Array<{ email: string }> };
      expect(items.map((i) => i.email)).toEqual(["stuck@example.com"]);
    });

    it("a search string that is not a uuid does not blow up the user_id match", async () => {
      const admin = await createTestUser();
      await promoteToAdmin(admin.userId);
      await seedEvent({ outcome: "failure", email: "stuck@example.com" });

      // `user_id` is a uuid column — matching it against a free-text query without
      // a ::text cast raises 42883 and 500s the whole panel.
      const res = await app.inject({
        method: "GET",
        url: "/api/admin/auth-events?q=not-a-uuid",
        headers: admin.headers,
      });
      expect(res.statusCode).toBe(200);
    });
  });

  // ── GET user-reports ───────────────────────────────────────────────────────
  // Rows are written by routes/user-reports.ts (its own test); here we pin the
  // READ contract the panel's «Репорты» accordion calls.
  describe("user reports", () => {
    async function seedReport(user: TestUser, text: string): Promise<void> {
      await pool.query(
        `insert into user_reports (id, user_id, text, page)
         values (gen_random_uuid(), $1::uuid, $2, '/schedule')`,
        [user.userId, text],
      );
    }

    it("403 for a non-admin", async () => {
      const user = await createTestUser();
      const res = await app.inject({
        method: "GET",
        url: "/api/admin/user-reports",
        headers: user.headers,
      });
      expect(res.statusCode).toBe(403);
    });

    it("lists reports newest first, attributed to the reporter's email", async () => {
      const admin = await createTestUser();
      await promoteToAdmin(admin.userId);
      const reporter = await createTestUser();
      await seedReport(reporter, "первый");
      await seedReport(reporter, "второй");

      const res = await app.inject({
        method: "GET",
        url: "/api/admin/user-reports",
        headers: admin.headers,
      });
      expect(res.statusCode).toBe(200);
      const { items } = res.json() as {
        items: Array<{ text: string; email: string; page: string | null }>;
      };
      expect(items.map((i) => i.text)).toEqual(["второй", "первый"]);
      expect(items[0].email).toBe(reporter.email);
      expect(items[0].page).toBe("/schedule");
    });

    it("q narrows by report text and survives a non-uuid query", async () => {
      const admin = await createTestUser();
      await promoteToAdmin(admin.userId);
      const reporter = await createTestUser();
      await seedReport(reporter, "кнопка не жмётся");
      await seedReport(reporter, "всё хорошо");

      const res = await app.inject({
        method: "GET",
        url: "/api/admin/user-reports?q=КНОПКА",
        headers: admin.headers,
      });
      expect(res.statusCode).toBe(200);
      const { items } = res.json() as { items: Array<{ text: string }> };
      expect(items.map((i) => i.text)).toEqual(["кнопка не жмётся"]);
    });
  });
});
