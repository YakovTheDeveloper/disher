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
import { devRoutes } from "./routes/dev.js";
import { betterAuthPlugin } from "../auth/fastify-plugin.js";
import { registerUserIdDecorator } from "../auth/require-user.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    ...(httpsOptions ? { https: httpsOptions } : {}),
  });

  await app.register(sensible);
  await app.register(cors, {
    origin: true,
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

  app.get("/health", async (_req, reply) => {
    return reply.send({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.setErrorHandler((error: FastifyError, _req, reply) => {
    console.error("Unhandled error:", error);
    reply.status(error.statusCode ?? 500).send({ error: error.message });
  });

  await app.register(analyticsRoutes, { prefix: "/api/analytics" });
  await app.register(suggestionsRoutes, { prefix: "/api/suggestions" });
  await app.register(freeTextFoodRoutes, { prefix: "/api/free-text-food" });
  await app.register(matcherTelemetryRoutes, { prefix: "/api/matcher-telemetry" });
  await app.register(bugReportRoutes, { prefix: "/api/bug-reports" });
  await app.register(diagLogsRoutes, { prefix: "/api/diag-logs" });
  await app.register(backupRoutes, { prefix: "/api/backup" });
  await app.register(analyzeRoutes, { prefix: "/api" });
  await app.register(analyzeDishRoutes, { prefix: "/api" });
  await app.register(analyzeDailyRoutes, { prefix: "/api" });

  // Dev/test-only: e2e bridge endpoint for verify-email. The route handler
  // itself rejects with 404 when NODE_ENV === 'production' as a second line
  // of defense, but skip registration entirely in prod so the route is not
  // even discoverable.
  if (process.env.NODE_ENV !== "production") {
    await app.register(devRoutes, { prefix: "/api/dev" });
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
