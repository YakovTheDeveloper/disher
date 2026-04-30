import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { analyticsRoutes } from "./routes/analytics.js";
import { suggestionsRoutes } from "./routes/suggestions.js";
import { freeTextFoodRoutes } from "./routes/free-text-food.js";
import { matcherTelemetryRoutes } from "./routes/matcher-telemetry.js";
import { bugReportRoutes } from "./routes/bug-reports.js";
import { diagLogsRoutes } from "./routes/diag-logs.js";
import { supabaseProxyRoutes } from "./routes/supabase-proxy.js";
import { backupRoutes } from "./routes/backup.js";
import { fileURLToPath } from "url";
import path from "path";
import { readFileSync, existsSync } from "fs";
import { initAnalyticsDb } from "./analytics-db.js";
import { initMatcher } from "./food-matcher.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// HTTPS configuration BEFORE creating Fastify app
const CERTS_DIR = path.join(__dirname, "../../certs");
const CERT_FILE = path.join(CERTS_DIR, "localhost-cert.pem");
const KEY_FILE = path.join(CERTS_DIR, "localhost-key.pem");

console.log("🔍 Certificate paths:");
console.log("   CERTS_DIR:", CERTS_DIR);
console.log("   CERT_FILE:", CERT_FILE, "exists:", existsSync(CERT_FILE));
console.log("   KEY_FILE:", KEY_FILE, "exists:", existsSync(KEY_FILE));

const httpsOptions = existsSync(CERT_FILE) && existsSync(KEY_FILE)
  ? {
    cert: readFileSync(CERT_FILE),
    key: readFileSync(KEY_FILE),
  }
  : undefined;

console.log("🔍 httpsOptions:", httpsOptions ? "DEFINED (will use HTTPS)" : "UNDEFINED (will use HTTP)");

initAnalyticsDb();

// Kick off matcher init in background — don't block server startup.
// Endpoints depending on it should call isMatcherReady() and return 503 if not ready.
initMatcher().catch((err) => {
  console.error("initMatcher failed:", err);
});

const app = Fastify({
  logger: true,
  ...(httpsOptions ? { https: httpsOptions } : {}),
});

await app.register(cors, {
  origin: true,
});

// Static content (MD articles)
await app.register(fastifyStatic, {
  root: path.join(__dirname, "../../content"),
  prefix: "/content/",
});

// List available nutrient articles: GET /articles/nutrients → JSON array of { folder, nutrientId, nutrientName }
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

// Single nutrient article: GET /articles/nutrients/:folder → /content/nutrients/{folder}/index.md
app.get<{ Params: { folder: string } }>(
  "/articles/nutrients/:folder",
  async (req, reply) => {
    return reply.sendFile(`nutrients/${req.params.folder}/index.md`);
  }
);

// Health check
app.get("/health", async (_req, reply) => {
  return reply.send({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Global error handler – log full error details
app.setErrorHandler((error, _req, reply) => {
  console.error("Unhandled error:", error);
  reply.status(error.statusCode ?? 500).send({ error: error.message });
});

// Routes
await app.register(analyticsRoutes, { prefix: "/api/analytics" });
await app.register(suggestionsRoutes, { prefix: "/api/suggestions" });
await app.register(freeTextFoodRoutes, { prefix: "/api/free-text-food" });
await app.register(matcherTelemetryRoutes, { prefix: "/api/matcher-telemetry" });
await app.register(bugReportRoutes, { prefix: "/api/bug-reports" });
await app.register(diagLogsRoutes, { prefix: "/api/diag-logs" });
await app.register(supabaseProxyRoutes, { prefix: "/api/sb" });
await app.register(backupRoutes, { prefix: "/api/backup" });

const HOST = process.env.HOST ?? "localhost";
const PORT = Number(process.env.PORT ?? 3100);

const protocol = httpsOptions ? "https" : "http";

app.listen({ host: HOST, port: PORT }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`API server running on ${protocol}://${HOST}:${PORT}`);
});
