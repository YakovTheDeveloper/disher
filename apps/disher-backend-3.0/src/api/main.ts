// Real server bootstrap. Loaded via a dynamic import from server.ts AFTER env
// has been resolved (dotenv in dev, docker-compose env_file in prod), so the
// module-load side effects below — auth/server.ts reading LOCAL_DATABASE_URL,
// db.ts reading the conn string, buildApp asserting BETTER_AUTH_SECRET — see a
// fully-populated process.env. (Static imports are hoisted, so this could not
// live in server.ts alongside a conditional dotenv load.)
import { buildApp } from "./buildApp.js";
import { initAnalyticsDb } from "./analytics-db.js";
import { initMatcher } from "./food-matcher.js";

initAnalyticsDb();

initMatcher().catch((err) => {
  console.error("initMatcher failed:", err);
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
