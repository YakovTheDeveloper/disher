import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestUser, type TestUser } from "../../../test/auth-helpers.js";
import { makeTestPool, truncateAllUserData } from "../../../test/db-helpers.js";
import { charge, getBalance } from "../../../billing/wallet.js";
import { PRICES_KOP } from "../../../billing/prices.js";
import { sweepStaleAnalyses, updateAnalysisFailed } from "../analyze.runJob.js";

// Regression coverage for two money-loss defects on the paid long-analysis path:
//
//   #1 A backend restart/crash mid-job burned the 5 ₽ charge and left the row
//      pending forever — the refund path only ever ran in-process. Fixed by
//      sweepStaleAnalyses() on boot.
//   #6 DELETE of a still-pending analysis made a later failure-refund read
//      user_id THROUGH the deleted row, find nothing, and skip the refund.
//      Fixed by threading userId into refundAnalysis explicitly.
//
// Both are DB-touching → gated on TEST_DATABASE_URL, same as analyze.test.ts.

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

let pool: ReturnType<typeof makeTestPool>;

const PRICE = PRICES_KOP.long_analysis;

async function refundCount(userId: string, requestId: string): Promise<number> {
  const r = await pool.query(
    `select 1 from wallet_ledger
      where user_id = $1 and kind = 'refund'
        and feature = 'long_analysis' and request_id = $2`,
    [userId, requestId],
  );
  return r.rowCount ?? 0;
}

// Insert a pending analysis row (result_md defaults to '') with an explicit
// created_at, so we can age a row past the sweep threshold.
async function insertPending(
  id: string,
  userId: string,
  createdAt: Date,
): Promise<void> {
  await pool.query(
    `insert into public.analyses
       (id, user_id, window_start, window_end, applied_hypotheses, created_at)
     values ($1::uuid, $2::uuid, $3::timestamptz, $4::timestamptz, '[]'::jsonb, $5::timestamptz)`,
    [
      id,
      userId,
      "2026-05-01T00:00:00Z",
      "2026-05-08T00:00:00Z",
      createdAt.toISOString(),
    ],
  );
}

beforeAll(() => {
  if (!ready) return;
  pool = makeTestPool();
});

afterAll(async () => {
  if (!ready) return;
  await pool?.end();
});

describeIfReady("startup-sweep + failure-refund recovery", () => {
  let user: TestUser;

  beforeEach(async () => {
    await truncateAllUserData(pool);
    user = await createTestUser();
  });

  it("#1: sweep fails + refunds a stale pending analysis, leaves a fresh one alone", async () => {
    const staleId = crypto.randomUUID();
    const freshId = crypto.randomUUID();

    // Both were charged the 5 ₽ kickoff.
    await charge(user.userId, "long_analysis", staleId);
    await charge(user.userId, "long_analysis", freshId);
    const afterCharges = await getBalance(user.userId);

    // One row aged well past the 10-minute threshold (as if a restart orphaned
    // it); one just created (a live job that must be left untouched).
    await insertPending(staleId, user.userId, new Date(Date.now() - 20 * 60_000));
    await insertPending(freshId, user.userId, new Date());

    const swept = await sweepStaleAnalyses();
    expect(swept).toBe(1);

    // Stale row is now marked failed with the restart reason…
    const staleRow = await pool.query<{ result_md: string }>(
      `select result_md from public.analyses where id = $1::uuid`,
      [staleId],
    );
    expect(staleRow.rows[0].result_md).toMatch(/^⚠️ Анализ не удался/);
    expect(staleRow.rows[0].result_md).toContain("прерван перезапуском сервера");

    // …and its charge was refunded exactly once.
    expect(await refundCount(user.userId, staleId)).toBe(1);

    // The fresh row is untouched — still pending, no refund.
    const freshRow = await pool.query<{ result_md: string }>(
      `select result_md from public.analyses where id = $1::uuid`,
      [freshId],
    );
    expect(freshRow.rows[0].result_md).toBe("");
    expect(await refundCount(user.userId, freshId)).toBe(0);

    // Money back for exactly the one swept charge.
    expect(await getBalance(user.userId)).toBe(afterCharges + PRICE);
  });

  it("#1: sweep is idempotent — a second run refunds nothing more", async () => {
    const id = crypto.randomUUID();
    await charge(user.userId, "long_analysis", id);
    await insertPending(id, user.userId, new Date(Date.now() - 20 * 60_000));

    expect(await sweepStaleAnalyses()).toBe(1);
    const balAfterFirst = await getBalance(user.userId);

    // Second boot: the row is no longer pending → nothing to sweep, no double
    // refund.
    expect(await sweepStaleAnalyses()).toBe(0);
    expect(await refundCount(user.userId, id)).toBe(1);
    expect(await getBalance(user.userId)).toBe(balAfterFirst);
  });

  it("#6: failure refund still fires after the pending row was DELETED", async () => {
    const id = crypto.randomUUID();
    await charge(user.userId, "long_analysis", id);
    const afterCharge = await getBalance(user.userId);

    // The user started the analysis, then deleted it while pending — the row is
    // gone. The old refundAnalysis looked up user_id through this row and found
    // nothing, so no refund happened. With userId passed explicitly it does.
    await updateAnalysisFailed(id, user.userId, new Error("timeout"));

    expect(await refundCount(user.userId, id)).toBe(1);
    expect(await getBalance(user.userId)).toBe(afterCharge + PRICE);
  });
});
