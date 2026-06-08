import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { createTestUser, type TestUser } from "../../test/auth-helpers.js";
import { makeTestPool, truncateAllUserData } from "../../test/db-helpers.js";
import { WELCOME_GRANT_KOP, PRICES_KOP } from "../prices.js";

// Read-only wallet endpoints (GET /api/balance, /balance/ledger, /billing/prices).

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

let app: FastifyInstance;
let pool: ReturnType<typeof makeTestPool>;

beforeAll(async () => {
  if (!ready) return;
  const { billingRoutes } = await import("../../api/routes/billing.js");
  app = Fastify({ logger: false });
  await app.register(billingRoutes, { prefix: "/api" });
  await app.ready();
  pool = makeTestPool();
});

afterAll(async () => {
  if (!ready) return;
  await app?.close();
  await pool?.end();
});

describeIfReady("billing read endpoints", () => {
  let user: TestUser;

  beforeEach(async () => {
    await truncateAllUserData(pool);
    user = await createTestUser();
  });

  it("GET /api/balance auto-creates the wallet and returns the welcome grant", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/balance",
      headers: user.headers,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      balanceKop: WELCOME_GRANT_KOP,
      balanceRub: WELCOME_GRANT_KOP / 100,
    });
  });

  it("GET /api/balance/ledger lists the welcome grant", async () => {
    // Touch balance first so the wallet (and welcome ledger row) exist.
    await app.inject({ method: "GET", url: "/api/balance", headers: user.headers });

    const res = await app.inject({
      method: "GET",
      url: "/api/balance/ledger",
      headers: user.headers,
    });
    expect(res.statusCode).toBe(200);
    const { items } = res.json() as {
      items: Array<{ kind: string; amountKop: number }>;
    };
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0]).toMatchObject({ kind: "grant", amountKop: WELCOME_GRANT_KOP });
  });

  it("GET /api/billing/prices returns the price map", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/billing/prices",
      headers: user.headers,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject(PRICES_KOP);
  });

  it("401 without a bearer", async () => {
    const res = await app.inject({ method: "GET", url: "/api/balance" });
    expect(res.statusCode).toBe(401);
  });
});
