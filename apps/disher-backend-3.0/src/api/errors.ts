// Backend error model — an RFC 9457 (`application/problem+json`) SUBSET.
//
// We deliberately do NOT ship the full ceremony (no dereferenceable `type` URI
// registry, no per-error docs page). What we DO guarantee is one stable machine
// shape for every failure so the frontend can branch on `code` instead of
// scraping prose from `error`:
//
//   { status, code, title, detail?, instance, ...extensions }
//
// `code` is the contract (a short stable slug); `title` is a human summary;
// `detail` is the specific, possibly-sensitive message (STRIPPED for 5xx in
// prod — see toProblem); `instance` is the per-request id so a user can quote it
// and we can grep the logs. Extensions (`needKop`/`haveKop`/`retryAfter`/
// `fieldErrors`) are flat top-level members per RFC 9457 §3.2.
//
// The 402 insufficient-balance body stays byte-compatible with its historical
// shape (see billing/http.ts) — it is sent directly there, NOT through toProblem.

/** Canonical error codes → default HTTP status. `code` is the FE-facing contract. */
export const CODES = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  payload_too_large: 413,
  unprocessable: 422,
  rate_limited: 429,
  internal_error: 500,
  ai_provider_error: 502,
  service_unavailable: 503,
  ai_timeout: 504,
} as const;

export type ErrorCode = keyof typeof CODES;

/** Human-readable summary per code (the `title` member; safe to expose always). */
export const CODE_TITLE: Record<ErrorCode, string> = {
  bad_request: "Bad Request",
  unauthorized: "Unauthorized",
  forbidden: "Forbidden",
  not_found: "Not Found",
  payload_too_large: "Payload Too Large",
  unprocessable: "Unprocessable Entity",
  rate_limited: "Too Many Requests",
  internal_error: "Internal Server Error",
  ai_provider_error: "Upstream AI Provider Error",
  service_unavailable: "Service Unavailable",
  ai_timeout: "Upstream AI Timeout",
};

/** Flat RFC 9457 extension members (§3.2) — all optional. */
export interface ProblemExtensions {
  /** 402 wallet shortfall (kopecks needed / held). */
  needKop?: number;
  haveKop?: number;
  /** Seconds the client should wait before retrying (429/503/504). */
  retryAfter?: number;
  /** Per-field validation messages (422). */
  fieldErrors?: Record<string, string>;
}

/** The serialized `application/problem+json` body (our subset). */
export interface Problem extends ProblemExtensions {
  status: number;
  code: ErrorCode;
  title: string;
  detail?: string;
  instance: string;
}

/**
 * An application error carrying a stable `code`, an HTTP `status` (defaulted from
 * the code), an optional human `detail`, and flat RFC 9457 extensions. Throw it
 * from anywhere; the global error handler renders it via toProblem().
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly detail?: string;
  readonly extensions: ProblemExtensions;

  constructor(
    code: ErrorCode,
    detail?: string,
    opts: { status?: number; extensions?: ProblemExtensions; cause?: unknown } = {},
  ) {
    super(detail ?? CODE_TITLE[code]);
    this.name = "AppError";
    this.code = code;
    this.status = opts.status ?? CODES[code];
    this.detail = detail;
    this.extensions = opts.extensions ?? {};
    if (opts.cause !== undefined) this.cause = opts.cause;
  }
}

// Convenience constructors for the codes we actually throw. Keep this list lean —
// add one only when a route needs it.
export const badRequest = (detail?: string, extensions?: ProblemExtensions) =>
  new AppError("bad_request", detail, { extensions });

export const unprocessable = (fieldErrors: Record<string, string>, detail?: string) =>
  new AppError("unprocessable", detail ?? "Validation failed", { extensions: { fieldErrors } });

export const notFound = (detail?: string) => new AppError("not_found", detail);

/** Upstream LLM/provider returned a non-ok / malformed response. Raw body → logs only. */
export const aiProviderError = (detail?: string, cause?: unknown) =>
  new AppError("ai_provider_error", detail ?? "AI provider request failed", { cause });

/** Upstream LLM/provider timed out (aborted). */
export const aiTimeout = (detail?: string, cause?: unknown) =>
  new AppError("ai_timeout", detail ?? "AI provider timed out", {
    cause,
    extensions: { retryAfter: 5 },
  });

/** True for the shape Fastify attaches to its own errors (validation, 404, …). */
function hasStatusCode(err: unknown): err is { statusCode: number; message?: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    typeof (err as { statusCode?: unknown }).statusCode === "number"
  );
}

/** One entry of the raw Ajv error array Fastify attaches when a route schema rejects. */
interface ValidationEntry {
  instancePath?: string;
  keyword?: string;
  params?: Record<string, unknown>;
  message?: string;
}

/** True for a Fastify schema-validation failure (FST_ERR_VALIDATION). */
function hasValidation(
  err: unknown,
): err is { validation: ValidationEntry[]; validationContext?: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    Array.isArray((err as { validation?: unknown }).validation)
  );
}

/**
 * The field a single Ajv error is about. For most keywords that is
 * `instancePath` ("/items/0/name" → "items.0.name"). `required` is the
 * exception: its path points at the PARENT object and the missing member's
 * name only exists in `params`.
 */
function fieldOf(entry: ValidationEntry): string {
  const base = (entry.instancePath ?? "").replace(/^\//, "").replace(/\//g, ".");
  const missing = entry.params?.missingProperty;
  if (entry.keyword === "required" && typeof missing === "string" && missing) {
    return base ? `${base}.${missing}` : missing;
  }
  return base || "(root)";
}

/**
 * Ajv errors → the `fieldErrors` extension. Keys are bare field names, not
 * "body.text": Fastify validates one context per request (it throws on the
 * first that fails), so the context can live in `detail` without ambiguity,
 * and the frontend can map a key straight onto its input.
 *
 * In practice this map usually holds exactly ONE entry: Fastify's Ajv runs with
 * `allErrors: false` (its default, and the one Ajv itself recommends against
 * changing for untrusted input — allErrors turns a crafted body into
 * quadratic work). A map is still the right shape: it stays additive if that
 * ever changes, and it is already the FE-facing contract.
 */
export function fieldErrorsFromValidation(
  validation: ValidationEntry[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of validation) {
    const field = fieldOf(entry);
    if (field in out) continue;
    out[field] = entry.message ?? "is invalid";
  }
  return out;
}

function codeForStatus(status: number): ErrorCode {
  const hit = (Object.entries(CODES) as [ErrorCode, number][]).find(([, s]) => s === status);
  if (hit) return hit[0];
  return status >= 500 ? "internal_error" : "bad_request";
}

/**
 * Render any thrown value into a Problem body. `instance` is the request id.
 * When `exposeDetail` is false (production), the `detail` of a 5xx is dropped so
 * an internal message / stack fragment never reaches the client — the `instance`
 * id is the bridge to the full server-side log. Stacks are NEVER serialized.
 */
export function toProblem(
  err: unknown,
  opts: { instance: string; exposeDetail: boolean },
): Problem {
  let status: number;
  let code: ErrorCode;
  let detail: string | undefined;
  let extensions: ProblemExtensions = {};

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    detail = err.detail;
    extensions = err.extensions;
  } else if (hasValidation(err)) {
    // MUST precede hasStatusCode: Fastify's validation error carries
    // statusCode 400 too, so the generic branch would swallow it and ship the
    // raw Ajv sentence as the only signal. Status stays 400 (not the 422 the
    // `unprocessable` constructor uses) — hand-written `reply.status(400)`
    // checks live beside schema'd ones on the same routes, and one validation
    // status is worth more than a more correct one applied to half of them.
    status = 400;
    code = "bad_request";
    const fieldErrors = fieldErrorsFromValidation(err.validation);
    extensions = { fieldErrors };
    const where = err.validationContext ?? "request";
    detail = `Invalid ${where}: ${Object.entries(fieldErrors)
      .map(([field, message]) => `${field} ${message}`)
      .join("; ")}`;
  } else if (hasStatusCode(err)) {
    status = err.statusCode;
    code = codeForStatus(status);
    detail = typeof err.message === "string" ? err.message : undefined;
  } else {
    status = 500;
    code = "internal_error";
    detail = err instanceof Error ? err.message : undefined;
  }

  const problem: Problem = {
    status,
    code,
    title: CODE_TITLE[code] ?? "Error",
    instance: opts.instance,
    ...extensions,
  };

  // 5xx detail is internal — expose only in dev. 4xx detail is client-actionable
  // (which field, which limit) so it stays.
  if (detail && (status < 500 || opts.exposeDetail)) {
    problem.detail = detail;
  }

  return problem;
}
