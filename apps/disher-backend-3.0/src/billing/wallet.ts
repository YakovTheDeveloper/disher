import type { PoolClient } from "pg";
import { pool } from "../api/db.js";
import { InsufficientBalanceError } from "./errors.js";
import { PRICES_KOP, WELCOME_GRANT_KOP, type Feature } from "./prices.js";

// Prepaid ruble wallet.
//
// `wallet_ledger` is the immutable source of truth; `wallet.balance_kop` is a
// fast mirror that the atomic conditional decrement reads/writes. All money is
// in integer kopecks.
//
// Correctness model:
//   * charge() runs a single conditional UPDATE (`WHERE balance_kop >= price`)
//     that takes a row lock — concurrent charges for one user serialize on it,
//     and the balance can never go below zero (also a DB CHECK).
//   * Idempotency by request_id: re-running the same charge/refund is a no-op,
//     backed by a UNIQUE (user_id, kind, request_id) index that also closes the
//     race where two identical requests slip past the in-tx existence check.

const KIND = { grant: "grant", topup: "topup", charge: "charge", refund: "refund" } as const;

export interface LedgerRow {
  id: string;
  amountKop: number;
  balanceAfterKop: number;
  kind: "grant" | "topup" | "charge" | "refund";
  feature: string | null;
  requestId: string | null;
  /** Diagnostics blob, e.g. `{reason}` for a grant. Defaults to `{}`. */
  meta: Record<string, unknown>;
  createdAt: string;
}

function db() {
  if (!pool) {
    throw new Error(
      "[wallet] no database pool — set REMOTE_DATABASE_URL or LOCAL_DATABASE_URL",
    );
  }
  return pool;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

async function withTx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db().connect();
  try {
    await client.query("begin");
    const out = await fn(client);
    await client.query("commit");
    return out;
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Lazily create the user's wallet and credit the one-time welcome grant.
 * Idempotent: the `wallet` PK + the ledger's UNIQUE(user,'grant','welcome')
 * guarantee the welcome is applied exactly once, even under concurrent calls.
 * Called at the top of every wallet op so we don't depend on a signup hook.
 */
export async function ensureWallet(userId: string): Promise<void> {
  await withTx(async (client) => {
    const ins = await client.query(
      `insert into wallet (user_id, balance_kop)
         values ($1, $2)
       on conflict (user_id) do nothing
       returning user_id`,
      [userId, WELCOME_GRANT_KOP],
    );
    if (ins.rowCount && ins.rowCount > 0) {
      await client.query(
        `insert into wallet_ledger
           (user_id, amount_kop, balance_after_kop, kind, feature, request_id)
         values ($1, $2, $2, '${KIND.grant}', null, 'welcome')`,
        [userId, WELCOME_GRANT_KOP],
      );
    }
  });
}

/** Current balance in kopecks (auto-creates the wallet on first read). */
export async function getBalance(userId: string): Promise<number> {
  await ensureWallet(userId);
  const r = await db().query<{ balance_kop: string }>(
    `select balance_kop from wallet where user_id = $1`,
    [userId],
  );
  return r.rows[0] ? Number(r.rows[0].balance_kop) : 0;
}

/** Recent ledger entries, newest first. */
export async function listLedger(userId: string, limit = 50): Promise<LedgerRow[]> {
  const capped = Math.min(Math.max(Math.trunc(limit) || 50, 1), 200);
  const r = await db().query<{
    id: string;
    amount_kop: string;
    balance_after_kop: string;
    kind: LedgerRow["kind"];
    feature: string | null;
    request_id: string | null;
    meta: Record<string, unknown> | null;
    created_at: Date | string;
  }>(
    `select id, amount_kop, balance_after_kop, kind, feature, request_id, meta, created_at
       from wallet_ledger
      where user_id = $1
      order by created_at desc, id desc
      limit $2`,
    [userId, capped],
  );
  return r.rows.map((row) => ({
    id: row.id,
    amountKop: Number(row.amount_kop),
    balanceAfterKop: Number(row.balance_after_kop),
    kind: row.kind,
    feature: row.feature,
    requestId: row.request_id,
    // jsonb comes back already parsed by pg; default to {} if somehow null.
    meta: row.meta ?? {},
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  }));
}

export interface ChargeResult {
  balanceKop: number;
  /** true when this request_id was already charged — no second debit happened. */
  alreadyCharged: boolean;
}

/**
 * Debit the flat price of `feature` from the user's balance.
 * Idempotent per (feature-charge, requestId). Throws InsufficientBalanceError
 * (→ 402) when the balance can't cover the price. `requestId` should be stable
 * across client retries of the same logical request.
 */
export async function charge(
  userId: string,
  feature: Feature,
  requestId: string,
): Promise<ChargeResult> {
  const price = PRICES_KOP[feature];
  await ensureWallet(userId);

  try {
    return await withTx(async (client) => {
      // 1. Already charged this request? Return the recorded balance, don't re-debit.
      const existing = await client.query<{ balance_after_kop: string }>(
        `select balance_after_kop from wallet_ledger
          where user_id = $1 and kind = '${KIND.charge}' and request_id = $2`,
        [userId, requestId],
      );
      if (existing.rows[0]) {
        return {
          balanceKop: Number(existing.rows[0].balance_after_kop),
          alreadyCharged: true,
        };
      }

      // 2. Atomic conditional decrement — locks the wallet row, can't go negative.
      const dec = await client.query<{ balance_kop: string }>(
        `update wallet set balance_kop = balance_kop - $2, updated_at = now()
          where user_id = $1 and balance_kop >= $2
          returning balance_kop`,
        [userId, price],
      );
      if (!dec.rows[0]) {
        const cur = await client.query<{ balance_kop: string }>(
          `select balance_kop from wallet where user_id = $1`,
          [userId],
        );
        throw new InsufficientBalanceError(
          price,
          Number(cur.rows[0]?.balance_kop ?? 0),
        );
      }
      const newBalance = Number(dec.rows[0].balance_kop);

      // 3. Journal the charge (UNIQUE index backstops a concurrent duplicate).
      await client.query(
        `insert into wallet_ledger
           (user_id, amount_kop, balance_after_kop, kind, feature, request_id)
         values ($1, $2, $3, '${KIND.charge}', $4, $5)`,
        [userId, -price, newBalance, feature, requestId],
      );

      return { balanceKop: newBalance, alreadyCharged: false };
    });
  } catch (err) {
    if (err instanceof InsufficientBalanceError) throw err;
    // Lost a race to an identical concurrent charge: our tx rolled back (so our
    // decrement is undone) — report the winner's result idempotently.
    if (isUniqueViolation(err)) {
      const existing = await db().query<{ balance_after_kop: string }>(
        `select balance_after_kop from wallet_ledger
          where user_id = $1 and kind = '${KIND.charge}' and request_id = $2`,
        [userId, requestId],
      );
      if (existing.rows[0]) {
        return {
          balanceKop: Number(existing.rows[0].balance_after_kop),
          alreadyCharged: true,
        };
      }
    }
    throw err;
  }
}

/**
 * Credit `feature`'s price back to the user. Idempotent per (refund, requestId)
 * and a no-op if no matching charge exists or it was already refunded. Used when
 * an AI request fails before producing output.
 */
export async function refund(
  userId: string,
  feature: Feature,
  requestId: string,
): Promise<void> {
  const price = PRICES_KOP[feature];
  try {
    await withTx(async (client) => {
      const charged = await client.query(
        `select 1 from wallet_ledger
          where user_id = $1 and kind = '${KIND.charge}' and request_id = $2`,
        [userId, requestId],
      );
      if (!charged.rows[0]) return; // never charged → nothing to refund

      const already = await client.query(
        `select 1 from wallet_ledger
          where user_id = $1 and kind = '${KIND.refund}' and request_id = $2`,
        [userId, requestId],
      );
      if (already.rows[0]) return; // already refunded

      const upd = await client.query<{ balance_kop: string }>(
        `update wallet set balance_kop = balance_kop + $2, updated_at = now()
          where user_id = $1
          returning balance_kop`,
        [userId, price],
      );
      const newBalance = Number(upd.rows[0]?.balance_kop ?? price);

      await client.query(
        `insert into wallet_ledger
           (user_id, amount_kop, balance_after_kop, kind, feature, request_id)
         values ($1, $2, $3, '${KIND.refund}', $4, $5)`,
        [userId, price, newBalance, feature, requestId],
      );
    });
  } catch (err) {
    if (isUniqueViolation(err)) return; // concurrent refund already applied
    throw err;
  }
}

export interface GrantResult {
  balanceKop: number;
  /** true when this requestId was already granted — no second credit happened. */
  alreadyApplied: boolean;
}

/**
 * Admin/promo top-up. Adds `amountKop` and journals a `grant` row with
 * `meta.reason`. This is the MVP way money enters a wallet (no payment provider
 * yet) — call it from a script/SQL or the guarded admin route.
 *
 * `requestId` is OPTIONAL and makes the grant idempotent (same shape as
 * charge()): a retry with the same requestId returns the recorded balance with
 * `alreadyApplied: true` instead of crediting twice — backed by the
 * (user,'grant',request_id) UNIQUE index. Without it, behaviour is byte-for-byte
 * the legacy path (request_id=null, always `alreadyApplied:false`) so existing
 * callers/tests are unaffected.
 *
 * `requestId === 'welcome'` is rejected: the lazy welcome grant already owns
 * (user,'grant','welcome') in that index, so reusing it would either collide or
 * masquerade as the welcome credit.
 */
export async function grant(
  userId: string,
  amountKop: number,
  reason: string,
  requestId?: string,
): Promise<GrantResult> {
  if (!Number.isInteger(amountKop) || amountKop <= 0) {
    throw new Error("grant amount must be a positive integer (kopecks)");
  }
  if (requestId === "welcome") {
    throw new Error("grant requestId 'welcome' is reserved for the welcome grant");
  }
  const metaJson = JSON.stringify({ reason: reason.slice(0, 200) });
  await ensureWallet(userId);

  // Legacy path: no requestId → non-idempotent, request_id=null, unchanged.
  if (requestId === undefined) {
    return withTx(async (client) => {
      const newBalance = await creditGrant(client, userId, amountKop, null, metaJson);
      return { balanceKop: newBalance, alreadyApplied: false };
    });
  }

  // Idempotent path (charge()-style): existence check inside the tx, and the
  // UNIQUE index backstops a concurrent duplicate (23505 → re-select the winner).
  try {
    return await withTx(async (client) => {
      const existing = await client.query<{ balance_after_kop: string }>(
        `select balance_after_kop from wallet_ledger
          where user_id = $1 and kind = '${KIND.grant}' and request_id = $2`,
        [userId, requestId],
      );
      if (existing.rows[0]) {
        return {
          balanceKop: Number(existing.rows[0].balance_after_kop),
          alreadyApplied: true,
        };
      }
      const newBalance = await creditGrant(
        client,
        userId,
        amountKop,
        requestId,
        metaJson,
      );
      return { balanceKop: newBalance, alreadyApplied: false };
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      const existing = await db().query<{ balance_after_kop: string }>(
        `select balance_after_kop from wallet_ledger
          where user_id = $1 and kind = '${KIND.grant}' and request_id = $2`,
        [userId, requestId],
      );
      if (existing.rows[0]) {
        return {
          balanceKop: Number(existing.rows[0].balance_after_kop),
          alreadyApplied: true,
        };
      }
    }
    throw err;
  }
}

/** Credit a grant + journal it inside an open tx. Returns the new balance. */
async function creditGrant(
  client: PoolClient,
  userId: string,
  amountKop: number,
  requestId: string | null,
  metaJson: string,
): Promise<number> {
  const upd = await client.query<{ balance_kop: string }>(
    `update wallet set balance_kop = balance_kop + $2, updated_at = now()
      where user_id = $1
      returning balance_kop`,
    [userId, amountKop],
  );
  const newBalance = Number(upd.rows[0]!.balance_kop);
  await client.query(
    `insert into wallet_ledger
       (user_id, amount_kop, balance_after_kop, kind, feature, request_id, meta)
     values ($1, $2, $3, '${KIND.grant}', null, $4, $5)`,
    [userId, amountKop, newBalance, requestId, metaJson],
  );
  return newBalance;
}
