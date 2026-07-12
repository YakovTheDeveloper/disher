// Real server bootstrap. Loaded via a dynamic import from server.ts AFTER env
// has been resolved (dotenv in dev, docker-compose env_file in prod), so the
// module-load side effects below — auth/server.ts reading LOCAL_DATABASE_URL,
// db.ts reading the conn string, buildApp asserting BETTER_AUTH_SECRET — see a
// fully-populated process.env. (Static imports are hoisted, so this could not
// live in server.ts alongside a conditional dotenv load.)
import { buildApp } from "./buildApp.js";
import { initMatcher } from "./food-matcher.js";
import { sweepStaleAnalyses } from "./routes/analyze.runJob.js";

initMatcher().catch((err) => {
  console.error("initMatcher failed:", err);
});

// Startup-sweep: a deploy/restart/crash while a paid long-analysis job was in
// flight would otherwise burn the user's charge and leave the row pending
// forever (the refund path only ran in-process). Fail + refund those orphans on
// boot. Best-effort and non-blocking — a slow/failed sweep must not delay
// listen(). Runs once per process (main.ts is the real entry; tests import
// buildApp directly and never load this file).
void sweepStaleAnalyses()
  .then((n) => {
    if (n > 0) console.log(`[startup-sweep] failed + refunded ${n} stale analyses`);
  })
  .catch((err) => {
    console.error("[startup-sweep] failed:", err);
  });

const app = await buildApp();

const HOST = process.env.HOST ?? "localhost";
const PORT = Number(process.env.PORT ?? 3100);
const protocol = app.__isHttps ? "https" : "http";

app.listen({ host: HOST, port: PORT }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`API server running on ${protocol}://${HOST}:${PORT}`);
});

// Graceful shutdown: every deploy sends SIGTERM. Without this, in-flight requests
// — including paid LLM analysis jobs mid-charge — are killed mid-connection and
// the client sees a raw 500. app.close() stops accepting new connections, drains
// in-flight ones, and runs onClose hooks (pool teardown lives there). compose's
// default 10s stop_grace_period covers a normal drain; bump it if long analyses
// legitimately hold a request longer. Guarded so a second signal can't re-enter.
let shuttingDown = false;
for (const sig of ["SIGTERM", "SIGINT"] as const) {
  process.on(sig, () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[shutdown] ${sig} received, draining…`);
    app
      .close()
      .then(() => {
        console.log("[shutdown] drained cleanly");
        process.exit(0);
      })
      .catch((err) => {
        console.error("[shutdown] error during close:", err);
        process.exit(1);
      });
  });
}
