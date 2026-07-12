import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestUser, type TestUser } from "../../test/auth-helpers.js";
import { makeTestPool, truncateAllUserData } from "../../test/db-helpers.js";
import { PRICES_KOP, WELCOME_GRANT_KOP } from "../prices.js";

// Wallet contract — debit/refund/grant invariants against a real Postgres.
// Skips when TEST_DATABASE_URL is unset (same gate as the other DB suites).

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

let pool: ReturnType<typeof makeTestPool>;
let wallet: typeof import("../wallet.js");
let InsufficientBalanceError: typeof import("../errors.js").InsufficientBalanceError;

beforeAll(async () => {
  if (!ready) return;
  wallet = await import("../wallet.js");
  ({ InsufficientBalanceError } = await import("../errors.js"));
  pool = makeTestPool();
});

afterAll(async () => {
  if (!ready) return;
  await pool?.end();
});

/** Force a balance directly (test setup only — bypasses the ledger). */
async function setBalance(userId: string, kop: number): Promise<void> {
  await pool.query(`update wallet set balance_kop = $2 where user_id = $1`, [
    userId,
    kop,
  ]);
}

async function ledgerByKind(userId: string, kind: string) {
  const r = await pool.query<{
    kind: string;
    amount_kop: string;
    feature: string | null;
    request_id: string | null;
  }>(
    `select kind, amount_kop, feature, request_id
       from wallet_ledger where user_id = $1 and kind = $2
       order by created_at asc, id asc`,
    [userId, kind],
  );
  return r.rows;
}

describeIfReady("wallet", () => {
  let user: TestUser;

  beforeEach(async () => {
    await truncateAllUserData(pool);
    user = await createTestUser();
  });

  it("ensureWallet credits the welcome grant exactly once", async () => {
    await wallet.ensureWallet(user.userId);
    await wallet.ensureWallet(user.userId); // idempotent

    expect(await wallet.getBalance(user.userId)).toBe(WELCOME_GRANT_KOP);
    const grants = await ledgerByKind(user.userId, "grant");
    expect(grants).toHaveLength(1);
    expect(Number(grants[0].amount_kop)).toBe(WELCOME_GRANT_KOP);
    expect(grants[0].request_id).toBe("welcome");
  });

  it("getBalance auto-creates the wallet with the welcome grant", async () => {
    expect(await wallet.getBalance(user.userId)).toBe(WELCOME_GRANT_KOP);
  });

  it("charge debits the feature price and journals it", async () => {
    const res = await wallet.charge(user.userId, "daily_analysis", "req-1");

    expect(res.alreadyCharged).toBe(false);
    expect(res.balanceKop).toBe(WELCOME_GRANT_KOP - PRICES_KOP.daily_analysis);
    expect(await wallet.getBalance(user.userId)).toBe(res.balanceKop);

    const charges = await ledgerByKind(user.userId, "charge");
    expect(charges).toHaveLength(1);
    expect(Number(charges[0].amount_kop)).toBe(-PRICES_KOP.daily_analysis);
    expect(charges[0].feature).toBe("daily_analysis");
  });

  it("charge is idempotent for the same requestId", async () => {
    const a = await wallet.charge(user.userId, "daily_analysis", "req-dup");
    const b = await wallet.charge(user.userId, "daily_analysis", "req-dup");

    expect(a.alreadyCharged).toBe(false);
    expect(b.alreadyCharged).toBe(true);
    expect(b.balanceKop).toBe(a.balanceKop);
    expect(await wallet.getBalance(user.userId)).toBe(
      WELCOME_GRANT_KOP - PRICES_KOP.daily_analysis,
    );
    expect(await ledgerByKind(user.userId, "charge")).toHaveLength(1);
  });

  it("charge throws InsufficientBalanceError with need/have when too poor", async () => {
    await wallet.ensureWallet(user.userId);
    await setBalance(user.userId, 100); // 1 ₽ < long_analysis (5 ₽)

    await expect(
      wallet.charge(user.userId, "long_analysis", "req-x"),
    ).rejects.toBeInstanceOf(InsufficientBalanceError);

    try {
      await wallet.charge(user.userId, "long_analysis", "req-x2");
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(InsufficientBalanceError);
      expect((e as InstanceType<typeof InsufficientBalanceError>).needKop).toBe(
        PRICES_KOP.long_analysis,
      );
      expect((e as InstanceType<typeof InsufficientBalanceError>).haveKop).toBe(100);
    }

    expect(await wallet.getBalance(user.userId)).toBe(100); // unchanged
    expect(await ledgerByKind(user.userId, "charge")).toHaveLength(0);
  });

  it("concurrent charges (different requestIds) never oversell or go negative", async () => {
    await wallet.ensureWallet(user.userId);
    await setBalance(user.userId, PRICES_KOP.daily_analysis); // exactly one charge

    const results = await Promise.allSettled([
      wallet.charge(user.userId, "daily_analysis", "r-a"),
      wallet.charge(user.userId, "daily_analysis", "r-b"),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.filter(
      (r) => r.status === "rejected",
    ) as PromiseRejectedResult[];
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(InsufficientBalanceError);

    expect(await wallet.getBalance(user.userId)).toBe(0);
    expect(await ledgerByKind(user.userId, "charge")).toHaveLength(1);
  });

  it("concurrent charges (same requestId) debit only once", async () => {
    const results = await Promise.allSettled([
      wallet.charge(user.userId, "daily_analysis", "same"),
      wallet.charge(user.userId, "daily_analysis", "same"),
    ]);

    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    expect(await wallet.getBalance(user.userId)).toBe(
      WELCOME_GRANT_KOP - PRICES_KOP.daily_analysis,
    );
    expect(await ledgerByKind(user.userId, "charge")).toHaveLength(1);
  });

  it("refund credits the price back and is idempotent", async () => {
    await wallet.charge(user.userId, "long_analysis", "req-r");
    expect(await wallet.getBalance(user.userId)).toBe(
      WELCOME_GRANT_KOP - PRICES_KOP.long_analysis,
    );

    await wallet.refund(user.userId, "long_analysis", "req-r");
    await wallet.refund(user.userId, "long_analysis", "req-r"); // idempotent

    expect(await wallet.getBalance(user.userId)).toBe(WELCOME_GRANT_KOP);
    expect(await ledgerByKind(user.userId, "refund")).toHaveLength(1);
  });

  it("refund without a prior charge is a no-op", async () => {
    await wallet.ensureWallet(user.userId);
    await wallet.refund(user.userId, "daily_analysis", "never");

    expect(await wallet.getBalance(user.userId)).toBe(WELCOME_GRANT_KOP);
    expect(await ledgerByKind(user.userId, "refund")).toHaveLength(0);
  });

  it("grant adds balance and journals a grant row", async () => {
    await wallet.ensureWallet(user.userId);
    const res = await wallet.grant(user.userId, 10_000, "promo");

    expect(res.balanceKop).toBe(WELCOME_GRANT_KOP + 10_000);
    expect(await wallet.getBalance(user.userId)).toBe(WELCOME_GRANT_KOP + 10_000);
    // welcome + promo
    expect(await ledgerByKind(user.userId, "grant")).toHaveLength(2);
  });

  it("grant without requestId reports alreadyApplied:false (back-compat)", async () => {
    // Amount deliberately ≠ WELCOME_GRANT_KOP so the find() below can't match the
    // welcome grant (same-amount collision would pick welcome's request_id).
    const res = await wallet.grant(user.userId, 6_000, "no-req");
    expect(res.alreadyApplied).toBe(false);
    expect(res.balanceKop).toBe(WELCOME_GRANT_KOP + 6_000);
    // request_id stays null on the legacy path.
    const grants = await ledgerByKind(user.userId, "grant");
    const promo = grants.find((g) => Number(g.amount_kop) === 6_000);
    expect(promo?.request_id).toBeNull();
  });

  it("grant is idempotent for the same requestId — one credit only", async () => {
    const a = await wallet.grant(user.userId, 7_000, "topup", "grant-dup");
    const b = await wallet.grant(user.userId, 7_000, "topup", "grant-dup");

    expect(a.alreadyApplied).toBe(false);
    expect(b.alreadyApplied).toBe(true);
    expect(b.balanceKop).toBe(a.balanceKop);
    expect(await wallet.getBalance(user.userId)).toBe(WELCOME_GRANT_KOP + 7_000);
    // welcome + the single idempotent grant.
    expect(await ledgerByKind(user.userId, "grant")).toHaveLength(2);
  });

  it("concurrent grants (same requestId) credit only once", async () => {
    const results = await Promise.allSettled([
      wallet.grant(user.userId, 3_000, "race", "grant-same"),
      wallet.grant(user.userId, 3_000, "race", "grant-same"),
    ]);

    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    expect(await wallet.getBalance(user.userId)).toBe(WELCOME_GRANT_KOP + 3_000);
    // welcome + one race-winning grant (the 23505 loser re-selected the winner).
    expect(await ledgerByKind(user.userId, "grant")).toHaveLength(2);
  });

  it("grant records meta.reason readable via listLedger", async () => {
    await wallet.grant(user.userId, 2_500, "birthday bonus", "grant-meta");
    const items = await wallet.listLedger(user.userId, 50);
    const row = items.find((i) => i.amountKop === 2_500);
    expect(row?.meta).toMatchObject({ reason: "birthday bonus" });
  });

  it("grant rejects the reserved 'welcome' requestId", async () => {
    await expect(
      wallet.grant(user.userId, 1_000, "nope", "welcome"),
    ).rejects.toThrow(/welcome/);
  });
});
