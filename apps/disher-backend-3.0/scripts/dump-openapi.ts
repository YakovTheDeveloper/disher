// Writes the committed OpenAPI artifact: openapi.json at the package root.
// With `--check` (npm run spec:check) it writes nothing and instead fails on the
// two ways the artifact can start lying:
//   • DRIFT — the committed file no longer matches what the code generates;
//   • PLACEHOLDERS — a response description of 'Default Response'. That is not a
//     blank: `responses` is REQUIRED in OpenAPI 3.0.3, so the placeholder is a
//     positive claim about a status code, and a generated client will believe it.
//
// The placeholder has TWO distinct causes, and the report must not conflate them
// — @fastify/swagger emits the same string for both (lib/spec/openapi/utils.js):
//   • :316 — the route declared no `response` schema at all, so the whole
//     `responses` object is invented: `{200: {description: 'Default Response'}}`.
//     Remedy: add the operation to api/openapi-responses.ts.
//   • :337-340 — the route HAS a schema, but a status code in it carries no
//     `description`; the placeholder is the last fallback of a `||` chain.
//     Remedy: describe that status code — the openapi-responses.ts entry is
//     already there, and telling the reader to add one sends them in circles.
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
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "openapi.json");
const CHECK = process.argv.includes("--check");

// These defaults MUST be assigned before the app modules load, and that is why
// buildApp is imported dynamically at the bottom rather than statically here:
// ESM hoists every static import and evaluates it before the first statement of
// this file, so auth/server.ts would read (and reject) a bare env before these
// lines ever ran. auth/server.ts throws «LOCAL_DATABASE_URL is required» and
// buildApp hard-requires a secret — both at construction. Neither signs nor
// queries anything here (no request is served; pg.Pool is lazy), so
// placeholders keep the dump runnable where no production secrets exist, which
// is precisely CI. Any real value in .env wins.
process.env.BETTER_AUTH_SECRET ??= "openapi-dump-placeholder-not-a-real-secret";
process.env.LOCAL_DATABASE_URL ??=
  "postgresql://openapi-dump:placeholder@127.0.0.1:5432/unused";

if (process.env.NODE_ENV !== "production") {
  console.error(
    "[spec:dump] refusing to run with NODE_ENV=%s — the spec would include dev-only routes.\n" +
      "            Use `npm run spec:dump`, which sets it.",
    process.env.NODE_ENV ?? "(unset)",
  );
  process.exit(1);
}

const { buildApp } = await import("../src/api/buildApp.js");
const app = await buildApp({ logger: false, https: false });
await app.ready();

type ResponseObject = { description?: unknown; content?: unknown };
type Operation = { responses?: Record<string, ResponseObject> };

const spec = app.swagger() as {
  paths?: Record<string, Record<string, Operation>>;
};
const serialized = JSON.stringify(spec, null, 2) + "\n";
await app.close();

const rel = path.relative(process.cwd(), OUT);
const paths = Object.keys(spec.paths ?? {});

const PLACEHOLDER = "Default Response";
// A path item also holds non-operation keys (`parameters`, `summary`, `$ref`);
// only these carry a `responses` object worth judging.
const HTTP_METHODS = new Set([
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
]);

type Placeholder = { op: string; codes: string[]; bare: boolean };

const placeholders: Placeholder[] = [];
for (const [route, item] of Object.entries(spec.paths ?? {})) {
  for (const [method, operation] of Object.entries(item)) {
    if (!HTTP_METHODS.has(method)) continue;
    const entries = Object.entries(operation.responses ?? {});
    // Match the description FIELD, not a substring of the serialized object: a
    // hand-written description that merely mentions the phrase is not a finding.
    const flagged = entries.filter(([, r]) => r?.description === PLACEHOLDER);
    if (flagged.length === 0) continue;
    // utils.js:316's invented object is exactly one 200 carrying a description
    // and nothing else. Anything richer means a real schema is present.
    const bare =
      entries.length === 1 &&
      flagged[0][0] === "200" &&
      flagged[0][1].content === undefined;
    placeholders.push({
      op: `${method.toUpperCase()} ${route}`,
      codes: flagged.map(([code]) => code),
      bare,
    });
  }
}

/** One paragraph per cause, so each names the remedy that actually applies. */
function describePlaceholders(indent: string): string[] {
  const out: string[] = [];
  const bare = placeholders.filter((p) => p.bare);
  const undescribed = placeholders.filter((p) => !p.bare);
  if (bare.length > 0) {
    out.push(
      `${bare.length} operation(s) declare no \`response\` schema, so the spec invents a 200\n` +
        `${indent}they may never send. Add them to src/api/openapi-responses.ts:\n` +
        bare.map((p) => `${indent}  ${p.op}`).join("\n"),
    );
  }
  if (undescribed.length > 0) {
    out.push(
      `${undescribed.length} operation(s) DO have a response schema, but a status code in it\n` +
        `${indent}carries no \`description\` — do NOT add an openapi-responses.ts entry, it\n` +
        `${indent}already exists. Describe the status code itself:\n` +
        undescribed
          .map((p) => `${indent}  ${p.op} — ${p.codes.join(", ")}`)
          .join("\n"),
    );
  }
  return out;
}

if (!CHECK) {
  writeFileSync(OUT, serialized, "utf8");
  console.log(`[spec:dump] ${rel} — ${paths.length} paths`);
  if (placeholders.length > 0) {
    console.warn(
      "[spec:dump] WARNING — `npm run spec:check` fails on this:\n" +
        describePlaceholders("            ")
          .map((p) => "            " + p)
          .join("\n\n"),
    );
  }
  process.exit(0);
}

const problems: string[] = [...describePlaceholders("  ")];

let committed: string | null = null;
try {
  committed = readFileSync(OUT, "utf8");
} catch {
  problems.push(`${rel} is missing. Run \`npm run spec:dump\`.`);
}
if (committed !== null && committed !== serialized) {
  problems.push(
    `${rel} is stale — the routes generate a different spec than the committed one.\n` +
      "  Run `npm run spec:dump` and commit the result.",
  );
}

if (problems.length > 0) {
  console.error("[spec:check] FAIL\n\n" + problems.map((p) => "- " + p).join("\n\n") + "\n");
  process.exit(1);
}
console.log(`[spec:check] OK — ${paths.length} paths, no placeholders, artifact up to date.`);
