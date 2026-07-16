import Fastify, { FastifyError, FastifyInstance, FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "url";
import path from "path";
import { readFileSync, existsSync } from "fs";
import { suggestionsRoutes } from "./routes/suggestions.js";
import { freeTextFoodRoutes } from "./routes/free-text-food.js";
import { freeTextEventRoutes } from "./routes/free-text-event.js";
import { matcherTelemetryRoutes } from "./routes/matcher-telemetry.js";
import { bugReportRoutes } from "./routes/bug-reports.js";
import { userReportsRoutes } from "./routes/user-reports.js";
import { diagLogsRoutes } from "./routes/diag-logs.js";
import { backupRoutes } from "./routes/backup.js";
import { analyzeRoutes } from "./routes/analyze.js";
import { analyzeDishRoutes } from "./routes/analyze-dish.js";
import { billingRoutes } from "./routes/billing.js";
import { adminRoutes } from "./routes/admin.js";
import { devRoutes } from "./routes/dev.js";
import { betterAuthPlugin } from "../auth/fastify-plugin.js";
import { registerUserIdDecorator, requireUser } from "../auth/require-user.js";
import { isTrustedOrigin, staticAllowedOrigins } from "../auth/origins.js";
import { requireTrustedOrigin } from "../auth/require-origin.js";
import { pool } from "./db.js";
import { isMatcherReady } from "./food-matcher.js";
import { toProblem } from "./errors.js";
import { resolveRequestId } from "../billing/http.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// CORS origin policy — the allowlist itself lives in auth/origins.ts, shared
// with better-auth's trustedOrigins and with requireTrustedOrigin.
//
// Dev used to `return true` here: reflect ANY Origin, with credentials:true.
// That was survivable while the session was a bearer token in localStorage (the
// token never rode along automatically). With a session COOKIE it is not — any
// page a developer happens to have open could call the dev API as them and read
// GET /api/backup, i.e. the whole food diary. So dev echoes LAN/localhost after
// a strict match instead of reflecting blindly.
//
// A request with no Origin at all is allowed THROUGH CORS (same-origin fetches,
// curl, health checks — CORS has nothing to say about them); it is
// requireTrustedOrigin, not this, that blocks a headerless mutating request.
function corsOriginDelegate(
  origin: string | undefined,
  cb: (err: Error | null, allow: boolean) => void,
): void {
  if (!origin) return cb(null, true);
  cb(null, isTrustedOrigin(origin));
}

export type BuildAppOptions = {
  logger?: FastifyServerOptions["logger"];
  https?: boolean;
};

export type BuiltApp = FastifyInstance & { __isHttps: boolean };

export async function buildApp(opts: BuildAppOptions = {}): Promise<BuiltApp> {
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error(
      "BETTER_AUTH_SECRET is required. Generate with `openssl rand -hex 32` and set in .env."
    );
  }

  // BACKEND_E2E_HTTP=1 forces plain HTTP regardless of cert presence — the
  // Playwright e2e setup binds a separate backend on a separate port and the
  // frontend's API_BASE is HTTP (Vite dev:e2e uses VITE_E2E_HTTP=1).
  const httpsOptions =
    process.env.BACKEND_E2E_HTTP === "1"
      ? undefined
      : opts.https !== false
        ? loadHttpsOptions()
        : undefined;

  const app = Fastify({
    logger: opts.logger ?? true,
    // 5MB body limit — analyze payloads with 30 days of foods/events can
    // legitimately reach 1-2MB; the default 1MB tripped power-user accounts.
    bodyLimit: 5 * 1024 * 1024,
    // Behind Caddy (reverse proxy) every req.ip would otherwise collapse to the
    // proxy's container IP, neutering the per-IP rate limits on the paid routes.
    // trustProxy parses X-Forwarded-For so req.ip is the real client. Safe
    // because the only hop in front of Fastify is our own Caddy.
    trustProxy: true,
    ...(httpsOptions ? { https: httpsOptions } : {}),
  });

  if (
    process.env.NODE_ENV === "production" &&
    staticAllowedOrigins().length === 0
  ) {
    console.warn(
      "[cors] production with empty allowlist — set FRONTEND_ORIGIN; SPA requests will be blocked",
    );
  }

  await app.register(sensible);
  await app.register(cors, {
    origin: corsOriginDelegate,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  await app.register(betterAuthPlugin);
  registerUserIdDecorator(app);

  await app.register(fastifyStatic, {
    root: path.join(__dirname, "../../content"),
    prefix: "/content/",
  });

  app.get("/articles/nutrients", async (_req, reply) => {
    const fs = await import("fs/promises");
    const nutrientsDir = path.join(__dirname, "../../content/nutrients");
    try {
      const entries = await fs.readdir(nutrientsDir, { withFileTypes: true });
      const articles = entries
        .filter((e) => e.isDirectory())
        .map((e) => {
          const [nutrientId, ...rest] = e.name.split("_");
          return { folder: e.name, nutrientId, nutrientName: rest.join("_") };
        });
      return reply.send(articles);
    } catch {
      return reply.send([]);
    }
  });

  app.get<{ Params: { folder: string } }>(
    "/articles/nutrients/:folder",
    async (req, reply) => {
      return reply.sendFile(`nutrients/${req.params.folder}/index.md`);
    }
  );

  // Liveness: the process is up. Cheap, never touches the DB — used by the
  // restart policy / load balancer to tell "alive" from "hung".
  app.get("/health", async (_req, reply) => {
    return reply.send({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness: the process can actually serve traffic — Postgres reachable AND
  // the embedding matcher initialized. The Docker HEALTHCHECK points here so a
  // container with a dead DB or an unready matcher (which would 503 the paid
  // routes) is reported unhealthy instead of silently "ok". Returns 503 so
  // orchestrators gate on the status code, not just the body.
  app.get("/health/ready", async (_req, reply) => {
    let db = false;
    try {
      if (pool) {
        await pool.query("SELECT 1");
        db = true;
      }
    } catch (err) {
      app.log.error({ err }, "health/ready db ping failed");
    }
    const matcherReady = isMatcherReady();
    const ready = db && matcherReady;
    return reply.status(ready ? 200 : 503).send({
      status: ready ? "ok" : "not-ready",
      db: db ? "ok" : "down",
      matcherReady,
      timestamp: new Date().toISOString(),
    });
  });

  // Single error shape for the whole app: an RFC 9457-subset problem+json body
  // (see api/errors.ts). `instance` is the per-request id (echoed as
  // X-Request-Id) so a user can quote it and we can grep the logs. In production
  // the `detail`/stack of a 5xx is stripped by toProblem — only the id crosses
  // the wire. 4xx detail (which field, which limit) stays. The 402
  // insufficient-balance body is sent directly in billing/http.ts and never
  // reaches here, so it stays byte-compatible.
  const exposeDetail = process.env.NODE_ENV !== "production";

  app.setErrorHandler((error: FastifyError, req, reply) => {
    const instance = resolveRequestId(req);
    // Full error (message + stack) to the server log only.
    req.log.error({ err: error, reqId: instance }, "request failed");
    const problem = toProblem(error, { instance, exposeDetail });
    reply
      .header("X-Request-Id", instance)
      .type("application/problem+json")
      .status(problem.status)
      .send(problem);
  });

  app.setNotFoundHandler((req, reply) => {
    const instance = resolveRequestId(req);
    const problem = toProblem(
      { statusCode: 404, message: `Route ${req.method} ${req.url} not found` },
      { instance, exposeDetail },
    );
    reply
      .header("X-Request-Id", instance)
      .type("application/problem+json")
      .status(problem.status)
      .send(problem);
  });

  // requireTrustedOrigin goes on every session-authenticated scope BEFORE
  // requireUser, so a forged cross-site request is refused with a 403 without
  // ever reaching the session lookup. better-auth guards its own /api/auth/*
  // routes; this is the same guarantee for ours. See auth/require-origin.ts for
  // why "no Origin header" is a rejection and not a pass.

  // suggestions + free-text-food are PAID (debit the wallet per LLM call). They
  // used to be anonymous (IP-rate-limited) — the app now mandates signup
  // (AuthGate), so requiring a session is safe. requireUser is added on a scope
  // here, NOT inside the route modules, so their pure-pipeline unit tests keep
  // registering the bare route without auth. Billing inside the handler is gated
  // on req.userId, which only those bare tests lack.
  await app.register(
    async (scope) => {
      scope.addHook("preHandler", requireTrustedOrigin);
      scope.addHook("preHandler", requireUser);
      await scope.register(suggestionsRoutes);
    },
    { prefix: "/api/suggestions" },
  );
  await app.register(
    async (scope) => {
      scope.addHook("preHandler", requireTrustedOrigin);
      scope.addHook("preHandler", requireUser);
      await scope.register(freeTextFoodRoutes);
    },
    { prefix: "/api/free-text-food" },
  );
  await app.register(
    async (scope) => {
      scope.addHook("preHandler", requireTrustedOrigin);
      scope.addHook("preHandler", requireUser);
      await scope.register(freeTextEventRoutes);
    },
    { prefix: "/api/free-text-event" },
  );
  // matcher-telemetry is the ONE deliberate exemption from requireTrustedOrigin.
  // It writes a client-controlled body to disk per request and CANNOT be gated:
  // the client ships it via navigator.sendBeacon on page-hide, which guarantees
  // neither an Authorization header nor an Origin. Instead the route strictly
  // validates the payload shape AND self-limits per IP (trustProxy makes req.ip
  // the real client behind the proxy) — see matcher-telemetry.ts. It carries no
  // session and mutates no user data, so CSRF has nothing to steal here.
  await app.register(matcherTelemetryRoutes, { prefix: "/api/matcher-telemetry" });
  await app.register(
    async (scope) => {
      scope.addHook("preHandler", requireTrustedOrigin);
      await scope.register(backupRoutes);
    },
    { prefix: "/api/backup" },
  );
  // Prod-safe user-facing bug reports (text + metadata → pg, auth-gated). The
  // dev disk sink (bugReportRoutes below) stays dev-only; this durable store is
  // the one real users reach from the settings drawer.
  await app.register(
    async (scope) => {
      scope.addHook("preHandler", requireTrustedOrigin);
      await scope.register(userReportsRoutes);
    },
    { prefix: "/api/user-reports" },
  );
  await app.register(
    async (scope) => {
      scope.addHook("preHandler", requireTrustedOrigin);
      await scope.register(analyzeRoutes);
      await scope.register(analyzeDishRoutes);
      await scope.register(billingRoutes);
    },
    { prefix: "/api" },
  );
  // Admin panel (topup + roles). NOT dev-gated — it's a production feature; the
  // requireAdmin preHandler (self-applied in the module) is the security gate.
  await app.register(
    async (scope) => {
      scope.addHook("preHandler", requireTrustedOrigin);
      await scope.register(adminRoutes);
    },
    { prefix: "/api/admin" },
  );

  // Dev/test-only routes. Each handler also 404s when NODE_ENV === 'production'
  // as a second line of defense, but skip registration entirely in prod so the
  // routes aren't even discoverable. bug-reports writes client-supplied JSON +
  // decoded image bytes to disk, so its locality must be enforced in code, not
  // just by the dev-gated frontend trigger.
  if (process.env.NODE_ENV !== "production") {
    await app.register(bugReportRoutes, { prefix: "/api/bug-reports" });
    await app.register(devRoutes, { prefix: "/api/dev" });
    // diag-logs is a dev-only diagnostic sink. The frontend only flushes to it
    // when import.meta.env.DEV && VITE_DIAG===1 (see diagLog.ts) — prod never
    // POSTs here. Registering it only in dev removes a public unauthenticated
    // per-request disk-write from the production surface entirely.
    await app.register(diagLogsRoutes, { prefix: "/api/diag-logs" });
  }

  const built = app as unknown as BuiltApp;
  built.__isHttps = !!httpsOptions;
  return built;
}

function loadHttpsOptions() {
  const CERTS_DIR = path.join(__dirname, "../../certs");
  const CERT_FILE = path.join(CERTS_DIR, "localhost-cert.pem");
  const KEY_FILE = path.join(CERTS_DIR, "localhost-key.pem");

  if (!existsSync(CERT_FILE) || !existsSync(KEY_FILE)) {
    return undefined;
  }
  return {
    cert: readFileSync(CERT_FILE),
    key: readFileSync(KEY_FILE),
  };
}
