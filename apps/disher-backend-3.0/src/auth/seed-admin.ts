// Boot-time admin seed. Idempotent — runs on every backend start (main.ts) and
// converges the DB to "one admin account with a big balance" without a payment
// provider or a manual DB poke.
//
// Why boot-hook, not a standalone script or a SQL migration:
//   * The prod image runs compiled JS with NO tsx (see pg-migrate.sh comment), so
//     a `.ts` seed script can't be invoked in deploy. main.ts is the real entry
//     and IS shipped/run — the seed rides it.
//   * A pure-SQL migration can't hash the password the way better-auth expects
//     (scrypt), and we don't want a password hash committed anyway — the operator
//     sets email+password in .env. signUpEmail does the correct hashing.
//
// Accounts are email+password (no username plugin in auth/server.ts). The email
// need NOT be deliverable: we mark `emailVerified=true` directly, so a synthetic
// address like `admin@disher.local` logs in without any email being sent. The
// operator picks ADMIN_SEED_EMAIL + ADMIN_SEED_PASSWORD in .env.production.
//
// role='admin' is written straight to the DB so requireAdmin passes WITHOUT a
// restart-gated ADMIN_USER_IDS entry (that env path stays as the fallback
// bootstrap for promoting others). Tests never import main.ts, so this never
// runs under vitest.

import { auth } from "./server.js";
import { pool } from "../api/db.js";
import { getBalance, grant } from "../billing/wallet.js";

// Default "куча денег" when ADMIN_SEED_BALANCE_RUB is unset. 1 000 000 ₽ in
// kopecks — comfortably below int4 max, effectively unlimited for AI features.
const DEFAULT_BALANCE_KOP = 1_000_000 * 100;

function targetBalanceKop(): number {
  const raw = process.env.ADMIN_SEED_BALANCE_RUB;
  if (!raw) return DEFAULT_BALANCE_KOP;
  const rub = Number(raw);
  if (!Number.isFinite(rub) || rub <= 0) return DEFAULT_BALANCE_KOP;
  return Math.round(rub) * 100;
}

/** Look up an existing user id by email, or null. */
async function findUserId(email: string): Promise<string | null> {
  const r = await pool!.query<{ id: string }>(
    `select id from users where email = $1`,
    [email],
  );
  return r.rows[0]?.id ?? null;
}

/**
 * Create the admin via better-auth (correct scrypt password hash), return its id.
 * `signUpEmail` still creates the user when REQUIRE_EMAIL_VERIFICATION=true (it
 * just withholds the session/token); we verify the email ourselves below.
 */
async function createAdmin(
  email: string,
  password: string,
  name: string,
): Promise<string> {
  const res = (await auth.api.signUpEmail({
    body: { email, password, name },
    asResponse: true,
  })) as Response;
  if (!res.ok) {
    const body = await res.text().catch(() => "<no body>");
    throw new Error(`signUpEmail failed: ${res.status} ${res.statusText} — ${body}`);
  }
  const json = (await res.json()) as { user: { id: string } };
  return json.user.id;
}

/**
 * Ensure a single admin account exists with role='admin', a verified email, and
 * at least the target balance. Best-effort: any failure is logged and swallowed
 * so a seed hiccup never blocks the server from listening. No-op unless BOTH
 * ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are set.
 */
export async function seedAdminUser(): Promise<void> {
  const email = process.env.ADMIN_SEED_EMAIL?.trim();
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !password) {
    console.log(
      "[admin-seed] OFF (set ADMIN_SEED_EMAIL + ADMIN_SEED_PASSWORD to seed an admin)",
    );
    return;
  }
  if (!pool) {
    console.warn("[admin-seed] skipped — no database pool (LOCAL_DATABASE_URL unset)");
    return;
  }

  try {
    const name = process.env.ADMIN_SEED_NAME?.trim() || "Admin";
    let userId = await findUserId(email);
    if (!userId) {
      userId = await createAdmin(email, password, name);
      console.log(`[admin-seed] created admin ${email} (${userId})`);
    }

    // Verify the email (synthetic addresses never get the link) + grant the admin
    // role. Idempotent — a re-run just re-asserts the same values.
    await pool.query(
      `update users set "emailVerified" = true, "role" = 'admin' where id = $1`,
      [userId],
    );

    // Top the wallet up to the target (never debits). Gating on current<target
    // makes reboots a no-op once the balance is there.
    const target = targetBalanceKop();
    const current = await getBalance(userId);
    if (current < target) {
      const { balanceKop } = await grant(userId, target - current, "admin seed top-up");
      console.log(
        `[admin-seed] ${email} balance ${(current / 100).toFixed(0)} → ${(balanceKop / 100).toFixed(0)} ₽`,
      );
    } else {
      console.log(`[admin-seed] ${email} balance already ≥ target (${(current / 100).toFixed(0)} ₽)`);
    }
  } catch (err) {
    console.error("[admin-seed] failed:", err);
  }
}
