import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../auth/require-admin.js";
import { grant, listLedger } from "../../billing/wallet.js";
import { pool } from "../db.js";

// Admin API (prefix /api/admin). Every route is gated by the self-applied
// requireAdmin preHandler (server-side guard — invariant 5). MVP surface: list
// users with balances, top up a wallet with a reason, read a user's ledger.
//
// All error responses are plain `reply.code(...).send({error})` — NOT thrown
// AppError — so the contract tests (bare Fastify, no global error handler) see
// the intended status. The happy path returns JSON directly.

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function db() {
  if (!pool) {
    throw new Error(
      "[admin] no database pool — set REMOTE_DATABASE_URL or LOCAL_DATABASE_URL",
    );
  }
  return pool;
}

interface TopupBody {
  amountKop?: unknown;
  reason?: unknown;
  requestId?: unknown;
}

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdmin);

  // Probe used by the client to learn "am I an admin?" when role !== 'admin'
  // (env-bootstrap admins have role='user'). 401/403 are handled by requireAdmin.
  app.get("/me", async (_req, reply) => {
    return reply.send({});
  });

  // One SQL: every user + their balance (0 when no wallet yet). No pagination —
  // there are dozens of users; the client filters/searches locally.
  app.get("/users", async (_req, reply) => {
    const r = await db().query<{
      id: string;
      email: string;
      role: string | null;
      created_at: Date | string;
      balance_kop: string;
      has_wallet: boolean;
    }>(
      `select u.id,
              u.email,
              u.role,
              u."createdAt" as created_at,
              coalesce(w.balance_kop, 0) as balance_kop,
              (w.user_id is not null) as has_wallet
         from "users" u
         left join wallet w on w.user_id = u.id
        order by u."createdAt" desc`,
    );
    const items = r.rows.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role ?? "user",
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : String(row.created_at),
      balanceKop: Number(row.balance_kop),
      hasWallet: row.has_wallet,
    }));
    return reply.send({ items });
  });

  // Top up a user's wallet. Idempotent per requestId (double-click / retry →
  // one credit, alreadyApplied:true). Validate everything BEFORE any SQL — in
  // particular the UUID, else pg raises 22P02 and we'd 500 instead of 400.
  app.post<{ Params: { id: string }; Body: TopupBody }>(
    "/users/:id/topup",
    async (req, reply) => {
      const { id } = req.params;
      if (!UUID_RE.test(id)) {
        return reply.code(400).send({ error: "invalid user id" });
      }

      const body = (req.body ?? {}) as TopupBody;
      const { amountKop, reason, requestId } = body;

      if (typeof amountKop !== "number" || !Number.isInteger(amountKop) || amountKop <= 0) {
        return reply.code(400).send({ error: "amountKop must be a positive integer (kopecks)" });
      }
      if (typeof reason !== "string" || reason.trim().length === 0) {
        return reply.code(400).send({ error: "reason is required" });
      }
      if (reason.trim().length > 200) {
        return reply.code(400).send({ error: "reason must be <= 200 chars" });
      }
      if (typeof requestId !== "string" || requestId.length < 1 || requestId.length > 100) {
        return reply.code(400).send({ error: "requestId must be a string of length 1..100" });
      }
      if (requestId === "welcome") {
        return reply.code(400).send({ error: "requestId 'welcome' is reserved" });
      }

      // Reject unknown users up front so topup can't silently no-op on a typo.
      const exists = await db().query(`select 1 from "users" where id = $1`, [id]);
      if (!exists.rows[0]) {
        return reply.code(404).send({ error: "user not found" });
      }

      const result = await grant(id, amountKop, reason.trim(), requestId);
      return reply.send(result);
    },
  );

  // Auth diagnostics (see auth/auth-events.ts + db/migrations/…_auth_events.sql).
  // Answers "почему у юзера не заходит": newest first, optionally narrowed to
  // failures only, optionally to one user (by email substring or user id).
  //
  // `problems=1` is the default view — a healthy login writes a row too, and the
  // successes outnumber the failures we're actually hunting.
  app.get<{
    Querystring: { limit?: string; problems?: string; q?: string };
  }>("/auth-events", async (req, reply) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const problemsOnly = req.query.problems === "1";
    const q = (req.query.q ?? "").trim();

    const where: string[] = [];
    const params: unknown[] = [];
    if (problemsOnly) where.push(`outcome <> 'success'`);
    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      const like = `$${params.length}`;
      // user_id is a uuid — cast before matching, else pg raises 42883 on `like`.
      where.push(`(lower(email) like ${like} or user_id::text like ${like})`);
    }
    params.push(limit);

    const r = await db().query<{
      id: string;
      created_at: Date | string;
      path: string | null;
      provider: string | null;
      outcome: string;
      status_code: number | null;
      error_code: string | null;
      error_message: string | null;
      user_id: string | null;
      email: string | null;
      ip: string | null;
      user_agent: string | null;
    }>(
      `select id, created_at, path, provider, outcome, status_code, error_code,
              error_message, user_id, email, ip, user_agent
         from auth_events
        ${where.length ? `where ${where.join(" and ")}` : ""}
        order by created_at desc
        limit $${params.length}`,
      params,
    );

    const items = r.rows.map((row) => ({
      id: String(row.id),
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : String(row.created_at),
      path: row.path,
      provider: row.provider,
      outcome: row.outcome,
      statusCode: row.status_code,
      errorCode: row.error_code,
      errorMessage: row.error_message,
      userId: row.user_id,
      email: row.email,
      ip: row.ip,
      userAgent: row.user_agent,
    }));
    return reply.send({ items });
  });

  // Пользовательские баг-репорты («Сообщить о проблеме» → routes/user-reports.ts,
  // таблица user_reports). Читаем ТОЛЬКО прод-сток из БД — dev-сток на диск
  // (routes/bug-reports.ts) в проде не регистрируется вовсе. Джойним почту
  // автора: репорт без «кто» не отработать.
  app.get<{ Querystring: { limit?: string; q?: string } }>(
    "/user-reports",
    async (req, reply) => {
      const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
      const q = (req.query.q ?? "").trim();

      const params: unknown[] = [];
      let where = "";
      if (q) {
        params.push(`%${q.toLowerCase()}%`);
        const like = `$${params.length}`;
        // user_id — uuid: приводим к тексту, иначе pg падает с 42883 на `like`.
        where = `where (lower(u.email) like ${like}
                     or lower(r.text) like ${like}
                     or r.user_id::text like ${like})`;
      }
      params.push(limit);

      const r = await db().query<{
        id: string;
        created_at: Date | string;
        text: string;
        page: string | null;
        screen_size: string | null;
        user_agent: string | null;
        pwa: string | null;
        user_id: string;
        email: string | null;
      }>(
        `select r.id, r.created_at, r.text, r.page, r.screen_size, r.user_agent,
                r.pwa, r.user_id, u.email
           from user_reports r
           left join "users" u on u.id = r.user_id
          ${where}
          order by r.created_at desc
          limit $${params.length}`,
        params,
      );

      const items = r.rows.map((row) => ({
        id: String(row.id),
        createdAt:
          row.created_at instanceof Date
            ? row.created_at.toISOString()
            : String(row.created_at),
        text: row.text,
        page: row.page,
        screenSize: row.screen_size,
        userAgent: row.user_agent,
        pwa: row.pwa,
        userId: row.user_id,
        email: row.email,
      }));
      return reply.send({ items });
    },
  );

  // Read a user's ledger (newest first), including meta so the reason is visible.
  app.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    "/users/:id/ledger",
    async (req, reply) => {
      const { id } = req.params;
      if (!UUID_RE.test(id)) {
        return reply.code(400).send({ error: "invalid user id" });
      }
      const limit = Number(req.query.limit) || 50;
      const items = await listLedger(id, limit);
      return reply.send({ items });
    },
  );
}
