import Fastify, { FastifyError, FastifyInstance, FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "url";
import path from "path";
import { readFileSync, existsSync } from "fs";
import { analyticsRoutes } from "./routes/analytics.js";
import { suggestionsRoutes } from "./routes/suggestions.js";
import { freeTextFoodRoutes } from "./routes/free-text-food.js";
import { matcherTelemetryRoutes } from "./routes/matcher-telemetry.js";
import { bugReportRoutes } from "./routes/bug-reports.js";
import { diagLogsRoutes } from "./routes/diag-logs.js";
import { backupRoutes } from "./routes/backup.js";
import { analyzeRoutes } from "./routes/analyze.js";
import { analyzeDishRoutes } from "./routes/analyze-dish.js";
import { analyzeDailyRoutes } from "./routes/analyze-daily.js";
import { billingRoutes } from "./routes/billing.js";
import { devRoutes } from "./routes/dev.js";
import { betterAuthPlugin } from "../auth/fastify-plugin.js";
import { registerUserIdDecorator, requireUser } from "../auth/require-user.js";
import { pool } from "./db.js";
import { isMatcherReady } from "./food-matcher.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// CORS origin policy. In dev we reflect any Origin (LAN IPs vary per machine).
// In prod we MUST NOT reflect arbitrary origins with credentials:true — build a
// static allowlist from FRONTEND_ORIGIN + BETTER_AUTH_TRUSTED_ORIGINS (CSV).
// An empty prod allowlist fails closed (blocks cross-origin) and is logged.
function resolveCorsOrigin(): true | string[] {
  if (process.env.NODE_ENV !== "production") return true;
  const allow = [
    ...(process.env.FRONTEND_ORIGIN ? [process.env.FRONTEND_ORIGIN] : []),
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS
      ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : []),
  ];
  if (allow.length === 0) {
    console.warn(
      "[cors] production with empty allowlist — set FRONTEND_ORIGIN; SPA requests will be blocked"
    );
  }
  return allow;
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

  await app.register(sensible);
  await app.register(cors, {
    origin: resolveCorsOrigin(),
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

  app.setErrorHandler((error: FastifyError, _req, reply) => {
    console.error("Unhandled error:", error);
    reply.status(error.statusCode ?? 500).send({ error: error.message });
  });

  await app.register(analyticsRoutes, { prefix: "/api/analytics" });

  // suggestions + free-text-food are PAID (debit the wallet per LLM call). They
  // used to be anonymous (IP-rate-limited) — the app now mandates signup
  // (AuthGate), so requiring a bearer is safe. requireUser is added on a scope
  // here, NOT inside the route modules, so their pure-pipeline unit tests keep
  // registering the bare route without auth. Billing inside the handler is gated
  // on req.userId, which only those bare tests lack.
  await app.register(
    async (scope) => {
      scope.addHook("preHandler", requireUser);
      await scope.register(suggestionsRoutes);
    },
    { prefix: "/api/suggestions" },
  );
  await app.register(
    async (scope) => {
      scope.addHook("preHandler", requireUser);
      await scope.register(freeTextFoodRoutes);
    },
    { prefix: "/api/free-text-food" },
  );
  // matcher-telemetry writes a client-controlled body to disk per request. It
  // CANNOT be auth-gated: the client ships it via navigator.sendBeacon on
  // page-hide (no way to attach an Authorization header), so a bearer hook
  // would 401 every real event. Instead the route strictly validates the
  // payload shape AND self-limits per IP (trustProxy makes req.ip the real
  // client behind Caddy) — see matcher-telemetry.ts. That bounds the public
  // disk-write surface without breaking the beacon.
  await app.register(matcherTelemetryRoutes, { prefix: "/api/matcher-telemetry" });
  await app.register(backupRoutes, { prefix: "/api/backup" });
  await app.register(analyzeRoutes, { prefix: "/api" });
  await app.register(analyzeDishRoutes, { prefix: "/api" });
  await app.register(analyzeDailyRoutes, { prefix: "/api" });
  await app.register(billingRoutes, { prefix: "/api" });

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
