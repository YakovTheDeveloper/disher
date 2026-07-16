// Boot-time DEV seed. The dev sibling of seed-admin.ts: it converges the local
// DB to "one throwaway account you can log into with a click" so a fresh dev
// clone (or a wiped DB) never has to run the Telegram redirect / email-verify
// flow just to open the app.
//
// NEVER runs in production — main.ts only calls this when NODE_ENV !== 'production'
// (same gate as devRoutes), and seedDevUser re-checks it defensively. The
// credentials below are public-by-design (they live in the frontend too, behind
// the «Войти (Dev)» button — see food-calc AuthForm + shared/config/devLogin.ts),
// so this account MUST never exist on a real deployment.
//
// Idempotent, best-effort, non-blocking — a seed hiccup must never delay listen().
// Account is email+password with a verified synthetic email (no inbox needed),
// topped up so the paid AI features are exercisable in dev.

import { auth } from "./server.js";
import { pool } from "../api/db.js";
import { getBalance, grant } from "../billing/wallet.js";

// Kept in sync with the frontend defaults in
// apps/food-calc/src/shared/config/devLogin.ts — change BOTH together, or the
// «Войти (Dev)» button signs in with credentials the seed never created.
const DEFAULT_DEV_EMAIL = "dev@disher.local";
// ≥ 11 chars to clear emailAndPassword.minPasswordLength (auth/server.ts).
const DEFAULT_DEV_PASSWORD = "dev-password-2026";

// Generous default so AI analysis/free-text-food work out of the box in dev.
const DEV_BALANCE_KOP = 100_000 * 100;

async function findUserId(email: string): Promise<string | null> {
  const r = await pool!.query<{ id: string }>(
    `select id from users where email = $1`,
    [email],
  );
  return r.rows[0]?.id ?? null;
}

async function createDevUser(
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
 * Ensure the local dev account exists, email-verified, with a healthy wallet.
 * No-op in production and when there is no DB pool. Never throws.
 */
export async function seedDevUser(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  if (!pool) {
    console.warn("[dev-seed] skipped — no database pool (LOCAL_DATABASE_URL unset)");
    return;
  }

  const email = process.env.DEV_SEED_EMAIL?.trim() || DEFAULT_DEV_EMAIL;
  const password = process.env.DEV_SEED_PASSWORD || DEFAULT_DEV_PASSWORD;

  try {
    let userId = await findUserId(email);
    if (!userId) {
      userId = await createDevUser(email, password, "Dev");
      console.log(`[dev-seed] created dev user ${email} (${userId})`);
    }

    // Verify the synthetic email so signIn works even with
    // REQUIRE_EMAIL_VERIFICATION=true. Idempotent.
    await pool.query(
      `update users set "emailVerified" = true where id = $1`,
      [userId],
    );

    const current = await getBalance(userId);
    if (current < DEV_BALANCE_KOP) {
      const { balanceKop } = await grant(
        userId,
        DEV_BALANCE_KOP - current,
        "dev seed top-up",
      );
      console.log(
        `[dev-seed] ${email} balance ${(current / 100).toFixed(0)} → ${(balanceKop / 100).toFixed(0)} ₽`,
      );
    }
    console.log(`[dev-seed] ready — sign in with ${email} via «Войти (Dev)»`);
  } catch (err) {
    console.error("[dev-seed] failed:", err);
  }
}
