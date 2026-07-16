// Writes the committed OpenAPI artifact: openapi.json at the package root.
//
// Run via `npm run spec:dump`, which forces NODE_ENV=production. That is the
// whole point of this script rather than a curl against a dev server:
// buildApp registers bug-reports / dev / diag-logs ONLY when NODE_ENV is not
// production, and @fastify/swagger derives the spec from the routes that
// actually registered. A dump taken against a dev instance would publish seven
// endpoints production does not serve — a contract that lies to the one reader
// it exists for.
//
// Nothing here listens or touches the network: app.ready() is enough for the
// route table to be complete, and pg.Pool does not connect until it is queried.
import "dotenv/config";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "../src/api/buildApp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "openapi.json");

// buildApp hard-requires a secret, and better-auth builds its config at
// construction. Neither signs anything here — no request is served — so a
// placeholder keeps the dump runnable on a machine (or a future CI job) that
// holds no production secrets. Any real value in .env wins.
process.env.BETTER_AUTH_SECRET ??= "openapi-dump-placeholder-not-a-real-secret";

if (process.env.NODE_ENV !== "production") {
  console.error(
    "[spec:dump] refusing to run with NODE_ENV=%s — the spec would include dev-only routes.\n" +
      "            Use `npm run spec:dump`, which sets it.",
    process.env.NODE_ENV ?? "(unset)",
  );
  process.exit(1);
}

const app = await buildApp({ logger: false, https: false });
await app.ready();

const spec = app.swagger();
writeFileSync(OUT, JSON.stringify(spec, null, 2) + "\n", "utf8");
await app.close();

const paths = Object.keys((spec as { paths?: object }).paths ?? {});
console.log(`[spec:dump] ${path.relative(process.cwd(), OUT)} — ${paths.length} paths`);
