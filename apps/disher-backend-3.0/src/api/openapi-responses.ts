// Documented responses for the OpenAPI spec — and ONLY for the spec.
//
// Why this lives here and not in the route schemas: Fastify uses `schema.response`
// to SERIALIZE (fast-json-stringify), which silently drops members the schema
// omits. That dropping is a deliberate safety net against accidental disclosure,
// not a bug, so we neither disable it nor feed it these shapes. @fastify/swagger's
// `transform` hook builds the doc against a LOCAL copy of the schema and never
// touches `route.schema` (lib/spec/openapi/index.js), so responses attached there
// reach the spec and never reach the serializer. Zero runtime effect.
//
// Why it must exist at all: `responses` is REQUIRED in OpenAPI 3.0.3 and must
// carry at least one status code. Staying silent is not an option — with no
// response schema @fastify/swagger emits `{200: {description: 'Default Response'}}`
// for every operation, i.e. the spec CLAIMS a 200 on routes that answer 204, 503
// or 402. Silence here reads as a lie downstream, in generated clients.
//
// Two error body shapes are live, and the table below says which is which per
// code rather than pretending there is one:
//   • `Problem` (application/problem+json) — anything that goes through the
//     global error handler: schema-validation failures, thrown AppErrors, 5xx.
//   • `ErrorEnvelope` (application/json) — hand-written `reply.status(n).send({error})`
//     inside handlers and guards. The older shape; still the majority of 4xx.
// A code that both paths can produce (400, 500) lists both media types.

import type { SwaggerOptions } from "@fastify/swagger";

import { CODES } from "./errors.js";

const PROBLEM_REF = { $ref: "#/components/schemas/Problem" } as const;
const ENVELOPE_REF = { $ref: "#/components/schemas/ErrorEnvelope" } as const;

// The schema type is pulled back out of the plugin's own option type rather than
// imported from `openapi-types`: that package is a transitive dependency of
// @fastify/swagger and does not resolve from this app.
type SchemaMap = NonNullable<
  NonNullable<NonNullable<Extract<SwaggerOptions, { openapi?: unknown }>["openapi"]>["components"]>["schemas"]
>;
type SchemaObject = Exclude<SchemaMap[string], { $ref: string }>;

/** components.schemas for the spec — merged into the swagger `openapi` option. */
export const ERROR_SCHEMAS: Record<string, SchemaObject> = {
  Problem: {
    title: "Problem",
    type: "object",
    description:
      "RFC 9457 subset (`application/problem+json`) produced by the global error handler. " +
      "`code` is the stable machine contract; `instance` is the request id, echoed as X-Request-Id. " +
      "A 5xx `detail` is stripped in production. Extension members are flat per RFC 9457 §3.2.",
    required: ["status", "code", "title", "instance"],
    properties: {
      status: { type: "integer", description: "Same value as the HTTP status." },
      code: { type: "string", enum: Object.keys(CODES) },
      title: { type: "string", description: "Human summary of `code`." },
      detail: { type: "string", description: "Specific message. Absent for 5xx in production." },
      instance: { type: "string", description: "Request id — quote it in a bug report." },
      fieldErrors: {
        type: "object",
        additionalProperties: { type: "string" },
        description:
          "Per-field validation messages. Usually ONE entry — Ajv runs with allErrors:false.",
      },
      needKop: { type: "integer" },
      haveKop: { type: "integer" },
      retryAfter: { type: "integer", description: "Seconds to wait before retrying." },
    },
  },
  ErrorEnvelope: {
    title: "ErrorEnvelope",
    type: "object",
    description:
      "The hand-written error body (`application/json`) sent straight from a handler or an " +
      "auth guard, bypassing the error handler. `error` is a human sentence, not a stable slug.",
    required: ["error"],
    properties: {
      error: { type: "string" },
      detail: { type: "string", description: "Upstream message, truncated. Only on 502 from analyze-dish." },
    },
  },
  InsufficientBalance: {
    title: "InsufficientBalance",
    type: "object",
    description:
      "The 402 body of every paid route. Sent directly by billing/http.ts and kept " +
      "byte-compatible with its historical shape — it never passes through the error handler.",
    required: ["error", "needKop", "haveKop"],
    properties: {
      error: { type: "string", enum: ["insufficient_balance"] },
      needKop: { type: "integer", description: "Price of the call, in kopecks." },
      haveKop: { type: "integer", description: "Current wallet balance, in kopecks." },
    },
  },
};

// ---------------------------------------------------------------------------
// Response entry builders. These are Fastify-flavoured JSON schema, which
// @fastify/swagger converts: a `content` key is passed through verbatim, and
// `type: 'null'` is its spelling for "no body".
// ---------------------------------------------------------------------------

const problem = (description: string) => ({
  description,
  content: { "application/problem+json": { schema: PROBLEM_REF } },
});

const envelope = (description: string) => ({
  description,
  content: { "application/json": { schema: ENVELOPE_REF } },
});

/** A code reachable BOTH through the error handler and from a hand-written reply. */
const either = (description: string) => ({
  description,
  content: {
    "application/problem+json": { schema: PROBLEM_REF },
    "application/json": { schema: ENVELOPE_REF },
  },
});

const empty = (description: string) => ({ description, type: "null" });

/** An answer whose body we do not (yet) describe — the shape is the handler's. */
const opaque = (description: string) => ({ description });

const insufficientBalance = () => ({
  description: "Wallet cannot cover the price. Nothing was charged and no work was started.",
  content: { "application/json": { schema: { $ref: "#/components/schemas/InsufficientBalance" } } },
});

// Reused error entries. The wording states WHO produces the code, because the
// same number means different things on different routes.
const BAD_REQUEST = either(
  "Malformed JSON, a body that fails the route schema (problem+json with `fieldErrors`), " +
    "or a bound the handler owns and the schema does not (application/json).",
);
const UNAUTHORIZED = envelope("No session cookie, or it is expired/invalid.");
const FORBIDDEN_ORIGIN = envelope("Missing or untrusted `Origin` — requireTrustedOrigin refused before the session lookup.");
const FORBIDDEN_ADMIN = envelope("Untrusted `Origin`, or the session is not an admin.");
const INTERNAL = either("Unhandled failure (problem+json; `detail` stripped in production) or an unconfigured DB (application/json).");
const RATE_LIMITED = envelope("Per-IP hourly rate limit exceeded.");
const AI_UPSTREAM = either("The LLM provider failed or returned something unparseable. Any charge was refunded.");
const MATCHER_UNREADY = envelope("The embedding matcher is still initializing — retry in a few seconds.");

/** The three guards that sit in front of every session-authenticated /api route. */
const AUTHED = { 401: UNAUTHORIZED, 403: FORBIDDEN_ORIGIN };

/**
 * operationId → the responses that route actually produces, verified against the
 * handler. Keyed by operationId rather than method+url so it cannot drift when a
 * prefix moves.
 */
const RESPONSES: Record<string, Record<string, unknown>> = {
  // --- content + health (no auth, no origin guard) -------------------------
  listNutrientArticles: {
    200: {
      description: "One entry per article folder. An unreadable directory answers 200 with [].",
      type: "array",
      items: {
        type: "object",
        properties: {
          folder: { type: "string" },
          nutrientId: { type: "string" },
          nutrientName: { type: "string" },
        },
      },
    },
  },
  getNutrientArticle: {
    200: {
      description: "The article's raw markdown.",
      content: { "text/markdown": { schema: { type: "string" } } },
    },
    404: problem("No article folder by that name."),
  },
  getHealth: {
    200: {
      description: "The process is up. Says nothing about the DB or the matcher.",
      type: "object",
      properties: {
        status: { type: "string", enum: ["ok"] },
        uptime: { type: "number", description: "Seconds since process start." },
        timestamp: { type: "string", format: "date-time" },
      },
    },
  },
  getReadiness: {
    200: {
      description: "Ready — Postgres reachable AND the matcher initialized.",
      type: "object",
      properties: {
        status: { type: "string", enum: ["ok"] },
        db: { type: "string", enum: ["ok"] },
        matcherReady: { type: "boolean" },
        timestamp: { type: "string", format: "date-time" },
      },
    },
    503: {
      description:
        "Not ready — the DB ping failed or the matcher is still loading. Same body shape as 200; " +
        "orchestrators gate on the status code.",
      type: "object",
      properties: {
        status: { type: "string", enum: ["not-ready"] },
        db: { type: "string", enum: ["ok", "down"] },
        matcherReady: { type: "boolean" },
        timestamp: { type: "string", format: "date-time" },
      },
    },
  },

  // --- paid LLM routes ----------------------------------------------------
  suggestDishProducts: {
    200: opaque("Suggested products for the dish."),
    400: BAD_REQUEST,
    ...AUTHED,
    402: insufficientBalance(),
    429: RATE_LIMITED,
    500: INTERNAL,
    502: AI_UPSTREAM,
    503: MATCHER_UNREADY,
  },
  suggestProductNutrients: {
    200: opaque("Suggested nutrient values for the product."),
    400: BAD_REQUEST,
    ...AUTHED,
    402: insufficientBalance(),
    429: RATE_LIMITED,
    500: INTERNAL,
    502: AI_UPSTREAM,
  },
  parseFreeTextFood: {
    200: opaque("Parsed food items, matched against the catalog."),
    400: BAD_REQUEST,
    ...AUTHED,
    402: insufficientBalance(),
    429: RATE_LIMITED,
    500: INTERNAL,
    502: AI_UPSTREAM,
    503: MATCHER_UNREADY,
  },
  parseFreeTextEvent: {
    200: opaque("Parsed events."),
    400: BAD_REQUEST,
    ...AUTHED,
    402: insufficientBalance(),
    429: RATE_LIMITED,
    500: INTERNAL,
    502: AI_UPSTREAM,
  },
  analyzeDish: {
    200: opaque("The dish breakdown. `observations` and `hypotheses` are always empty here."),
    400: BAD_REQUEST,
    ...AUTHED,
    402: insufficientBalance(),
    502: AI_UPSTREAM,
  },

  // --- telemetry (no auth, no origin guard — see buildApp) -----------------
  logMatcherTelemetry: {
    204: empty("Recorded."),
    400: BAD_REQUEST,
    429: envelope("Per-IP telemetry rate limit exceeded."),
  },

  // --- backup -------------------------------------------------------------
  putBackup: {
    204: empty("Snapshot stored. Last write wins."),
    400: BAD_REQUEST,
    ...AUTHED,
    500: INTERNAL,
  },
  getBackup: {
    200: opaque("The snapshot exactly as the client stored it. The server never inspects it."),
    ...AUTHED,
    404: empty("No snapshot for this user."),
    500: INTERNAL,
  },
  deleteBackup: {
    204: empty("Vault erased. Idempotent — 204 whether or not a row existed."),
    ...AUTHED,
    500: INTERNAL,
  },

  // --- feedback -----------------------------------------------------------
  submitUserReport: {
    200: {
      description: "Report stored.",
      type: "object",
      properties: { ok: { type: "boolean", enum: [true] } },
    },
    400: BAD_REQUEST,
    ...AUTHED,
    500: INTERNAL,
  },

  // --- analysis -----------------------------------------------------------
  startAnalysis: {
    200: opaque("The pending (or, on a repeat POST, the existing) analysis row."),
    400: BAD_REQUEST,
    ...AUTHED,
    402: insufficientBalance(),
    404: envelope("The id exists but belongs to another user. The charge was refunded."),
    500: INTERNAL,
  },
  listAnalyses: {
    200: opaque("The user's analyses, newest first (max 500)."),
    ...AUTHED,
    500: INTERNAL,
  },
  getAnalysis: {
    200: opaque("One analysis. Empty `result_md` = still running."),
    ...AUTHED,
    404: envelope("No such analysis for this user. A malformed id answers 404, not 400 — deliberate."),
    500: INTERNAL,
  },
  deleteAnalysis: {
    200: {
      description: "Deleted.",
      type: "object",
      properties: { ok: { type: "boolean", enum: [true] } },
    },
    ...AUTHED,
    404: envelope("Already gone, not this user's, or a malformed id. The frontend treats it as success."),
    500: INTERNAL,
  },

  // --- billing (read-only) ------------------------------------------------
  getBalance: {
    200: {
      description: "Current balance. Creates the wallet (welcome grant) on first read.",
      type: "object",
      properties: {
        balanceKop: { type: "integer" },
        balanceRub: { type: "number" },
      },
    },
    ...AUTHED,
    500: INTERNAL,
  },
  listLedger: {
    200: opaque("Ledger entries, newest first."),
    400: BAD_REQUEST,
    ...AUTHED,
    500: INTERNAL,
  },
  getPrices: {
    200: opaque("Flat per-feature prices in kopecks, keyed by feature."),
    ...AUTHED,
    500: INTERNAL,
  },

  // --- admin (requireAdmin also answers 403) ------------------------------
  getAdminMe: {
    200: {
      description: "The caller is an admin. The body is intentionally empty — the status IS the answer.",
      type: "object",
    },
    401: UNAUTHORIZED,
    403: FORBIDDEN_ADMIN,
  },
  listUsers: {
    200: opaque("Every user + wallet balance."),
    401: UNAUTHORIZED,
    403: FORBIDDEN_ADMIN,
    500: INTERNAL,
  },
  topupUser: {
    200: opaque("The credit result. A repeat with the same requestId returns `alreadyApplied: true`."),
    400: BAD_REQUEST,
    401: UNAUTHORIZED,
    403: FORBIDDEN_ADMIN,
    404: envelope("No user with that id."),
    500: INTERNAL,
  },
  listAuthEvents: {
    200: opaque("Auth diagnostics, newest first."),
    401: UNAUTHORIZED,
    403: FORBIDDEN_ADMIN,
    500: INTERNAL,
  },
  listUserReports: {
    200: opaque("User-submitted reports, newest first."),
    401: UNAUTHORIZED,
    403: FORBIDDEN_ADMIN,
    500: INTERNAL,
  },
  getUserLedger: {
    200: opaque("One user's ledger, newest first."),
    400: BAD_REQUEST,
    401: UNAUTHORIZED,
    403: FORBIDDEN_ADMIN,
    500: INTERNAL,
  },
};

/**
 * The documented responses for an operation, or undefined when we have none —
 * in which case @fastify/swagger falls back to its `Default Response` 200
 * placeholder, i.e. the spec starts claiming a 200 the route may never send. A
 * new route must be added here; nothing enforces that yet, so the placeholder
 * is the tell — grep the committed openapi.json for it.
 */
export function responsesFor(operationId: unknown): Record<string, unknown> | undefined {
  return typeof operationId === "string" ? RESPONSES[operationId] : undefined;
}
