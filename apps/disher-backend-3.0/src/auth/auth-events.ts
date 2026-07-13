// Auth diagnostics: one `auth_events` row per login-relevant attempt, so
// "почему у юзера не заходит" is answerable from the admin panel hours later
// instead of by grepping a rotated container log on someone else's box.
//
// Wired into better-auth from two places (auth/server.ts):
//
//   hooks.after      — every endpoint that RETURNED, success or rejection. An
//                      APIError thrown by a handler is caught upstream and put
//                      on `ctx.context.returned` (better-auth
//                      api/to-auth-endpoints.mjs), so one hook sees both.
//   onAPIError.onError — the residue: exceptions that are NOT APIError (a bug,
//                      Postgres down, Telegram's token endpoint unreachable).
//                      Those are re-thrown past the after-hooks and only reach
//                      the router's onError. They carry no endpoint context,
//                      hence path/provider are null on those rows.
//
// THE TRAP — a redirect IS an APIError. `ctx.redirect(url)` returns
// `new APIError("FOUND", undefined, headers{location})` (better-call
// context.mjs). The Telegram callback signals BOTH outcomes that way: success
// redirects to the SPA, failure redirects to `errorURL?error=<code>` (better-auth
// plugins/generic-oauth/routes.mjs). Classify a FOUND by its `location` — treat
// every redirect as a failure and every successful Telegram login is logged as
// broken; treat none as a failure and the issuer_missing class of bug goes
// invisible, which is the exact bug this table exists to catch.
//
// Never write a password, bearer token, id_token or OAuth code here — only the
// outcome and the error code. `email` is the ATTEMPTED identifier (may belong to
// no user at all), which is the point: it is how you find the failing user.

import { APIError } from "better-auth/api";
import { pool } from "../api/db.js";

export type AuthOutcome = "success" | "failure" | "error";

export interface AuthEventRow {
  path: string | null;
  provider: string | null;
  outcome: AuthOutcome;
  statusCode: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  userId: string | null;
  email: string | null;
  ip: string | null;
  userAgent: string | null;
}

// Endpoints worth a row. Everything else better-auth serves (/get-session on
// every app boot, /ok, /error) would bury the signal in noise.
const TRACKED_PATHS = new Set([
  "/sign-in/email",
  "/sign-up/email",
  "/sign-in/oauth2",
  "/oauth2/callback/:providerId",
  "/verify-email",
  "/send-verification-email",
  "/request-password-reset",
  "/reset-password",
  "/sign-out",
]);

export function isTrackedAuthPath(path: string | undefined): boolean {
  return typeof path === "string" && TRACKED_PATHS.has(path);
}

function headerValue(headers: unknown, name: string): string | null {
  if (headers instanceof Headers) return headers.get(name);
  if (headers && typeof headers === "object") {
    const record = headers as Record<string, unknown>;
    const hit = record[name] ?? record[name.toLowerCase()];
    return typeof hit === "string" ? hit : null;
  }
  return null;
}

/**
 * Read the `error` query param off a redirect Location. better-auth encodes the
 * failure reason there (`?error=issuer_missing`, `?error=oauth_code_missing`, …)
 * — it is the only machine-readable trace a failed OAuth callback leaves.
 */
export function errorCodeFromRedirect(location: string | null): string | null {
  if (!location) return null;
  try {
    // `base` covers the relative-URL case; we only read a query param off it.
    const url = new URL(location, "http://placeholder.invalid");
    const code = url.searchParams.get("error");
    return code && code.length > 0 ? code : null;
  } catch {
    return null;
  }
}

export interface Classified {
  outcome: AuthOutcome;
  statusCode: number | null;
  errorCode: string | null;
  errorMessage: string | null;
}

/**
 * What did this endpoint actually do? Pure — the whole point of the module's
 * correctness lives here, so it is unit-tested without a database.
 *
 * `returned` is `ctx.context.returned`: the handler's value, or the APIError it
 * threw (redirects included — see the header note).
 */
export function classifyAuthResult(returned: unknown): Classified {
  if (!(returned instanceof APIError)) {
    return { outcome: "success", statusCode: 200, errorCode: null, errorMessage: null };
  }

  const statusCode = typeof returned.statusCode === "number" ? returned.statusCode : null;

  if (returned.status === "FOUND") {
    const location = headerValue(returned.headers, "location");
    const errorCode = errorCodeFromRedirect(location);
    if (!errorCode) {
      return { outcome: "success", statusCode, errorCode: null, errorMessage: null };
    }
    return {
      outcome: "failure",
      statusCode,
      errorCode,
      errorMessage: errorCodeFromRedirectDescription(location),
    };
  }

  const body = returned.body as { code?: unknown; message?: unknown } | undefined;
  const code = typeof body?.code === "string" ? body.code : String(returned.status);
  const message =
    typeof body?.message === "string" ? body.message : (returned.message ?? null);

  return {
    outcome: "failure",
    statusCode,
    errorCode: code,
    errorMessage: message,
  };
}

function errorCodeFromRedirectDescription(location: string | null): string | null {
  if (!location) return null;
  try {
    const url = new URL(location, "http://placeholder.invalid");
    const description = url.searchParams.get("error_description");
    return description && description !== "undefined" ? description : null;
  } catch {
    return null;
  }
}

/**
 * The slice of better-auth's endpoint context this module reads. Declared
 * structurally (not imported) so the hook body stays typed without dragging in
 * better-auth's deeply-generic `GenericEndpointContext` — and so the builder is
 * callable from a test with a plain object literal.
 */
export interface AuthHookContext {
  path?: string;
  params?: Record<string, string | undefined>;
  body?: unknown;
  headers?: Headers;
  context: {
    returned?: unknown;
    newSession?: { user?: { id?: string; email?: string } } | null;
    session?: { user?: { id?: string; email?: string } } | null;
  };
}

function bodyField(body: unknown, key: string): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Which provider was this attempt made with? The OAuth callback's `path` is the
 * template (`/oauth2/callback/:providerId`), so the real id lives in `params`.
 */
export function providerFromContext(ctx: AuthHookContext): string | null {
  const fromParams = ctx.params?.providerId;
  if (typeof fromParams === "string" && fromParams.length > 0) return fromParams;
  const fromBody = bodyField(ctx.body, "providerId");
  if (fromBody) return fromBody;
  const path = ctx.path ?? "";
  if (path.endsWith("/email")) return "email";
  return null;
}

export function buildAuthEvent(ctx: AuthHookContext, ip: string | null): AuthEventRow {
  const classified = classifyAuthResult(ctx.context.returned);
  const session = ctx.context.newSession ?? ctx.context.session ?? null;

  return {
    path: ctx.path ?? null,
    provider: providerFromContext(ctx),
    outcome: classified.outcome,
    statusCode: classified.statusCode,
    errorCode: classified.errorCode,
    errorMessage: classified.errorMessage,
    userId: session?.user?.id ?? null,
    // The attempted identifier first (a failed sign-in has no session, and the
    // typo'd email IS the diagnostic); the session's email only as a fallback,
    // which is what makes Telegram rows carry `tg_<sub>@telegram.local`.
    email: bodyField(ctx.body, "email") ?? session?.user?.email ?? null,
    ip,
    userAgent: ctx.headers?.get("user-agent") ?? null,
  };
}

const MAX_TEXT = 500;

function clip(value: string | null | undefined): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  return value.length > MAX_TEXT ? value.slice(0, MAX_TEXT) : value;
}

/**
 * Best-effort insert. NEVER throws and NEVER blocks the response: a diagnostics
 * table that can 500 a login is worse than no diagnostics at all. Fire-and-forget
 * with a .catch, same contract as the Resend dispatch in server.ts.
 */
export function recordAuthEvent(event: AuthEventRow): void {
  if (!pool) return;
  pool
    .query(
      `insert into auth_events
         (path, provider, outcome, status_code, error_code, error_message, user_id, email, ip, user_agent)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        clip(event.path),
        clip(event.provider),
        event.outcome,
        event.statusCode,
        clip(event.errorCode),
        clip(event.errorMessage),
        event.userId,
        clip(event.email),
        clip(event.ip),
        clip(event.userAgent),
      ],
    )
    .catch((err: unknown) => {
      console.error("[auth-events] insert failed", err);
    });
}
