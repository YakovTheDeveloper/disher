import "dotenv/config";
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
