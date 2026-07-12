// Telegram login via Telegram's official OIDC flow (oauth.telegram.org), wired
// through better-auth's first-party `genericOAuth` plugin. Bearer mode is
// unchanged: the genericOAuth callback mints a session and the `bearer()`
// plugin emits the `set-auth-token` header exactly as for email sign-in.
//
// Why OIDC + genericOAuth (not the classic Login Widget + hand-rolled HMAC):
//  - redirect-based → immune to the standalone-PWA popup-block bug (a real
//    cross-library defect: an installed PWA is backgrounded the instant a
//    popup opens, so the widget's `data-onauth` callback never fires);
//  - no bespoke crypto, no custom session-mint endpoint, no third-party pkg;
//  - Telegram exposes a standard discovery doc + JWKS.
//
// Telegram specifics handled here:
//  - NO userinfo endpoint: all profile data lives in the `id_token` (a JWT).
//    We supply `getUserInfo()` to decode it instead of letting better-auth
//    call a userinfo URL (there is none).
//  - NO email: Telegram never returns an email, but `users.email` is NOT NULL
//    UNIQUE. We synthesize a per-identity, non-routable placeholder
//    (`tg_<sub>@telegram.local`) and mark it verified so better-auth's
//    `emailVerification.sendOnSignUp` never tries to email a bogus address.
//    Identity is keyed on (providerId='telegram', accountId=<sub>) via the
//    `account` table — NEVER on the synthetic email — so two Telegram users
//    can't merge into one account and a synthetic address can't collide with a
//    real user's email.
//
// Trust model for the id_token: it arrives from Telegram's token endpoint over
// TLS in exchange for a one-time PKCE code that only our backend and Telegram
// share, so it is channel-authenticated — an attacker cannot inject a forged
// token into that exchange. We validate `iss` / `aud` / `exp` of the token
// here. Full JWKS RS256 signature verification is a documented hardening step
// (see apps/food-calc/tds/telegram-auth.md) — not required for correctness given the
// authenticated channel, but defense in depth if the flow is ever exposed to
// untrusted token sources.
//
// `requireIssuerValidation` MUST stay off. It does NOT check the id_token's
// `iss` claim (we do that ourselves below) — better-auth checks the RFC 9207
// `iss` QUERY PARAM on the callback redirect, and Telegram never sends one: its
// discovery doc omits `authorization_response_iss_parameter_supported`. Turning
// it on rejected every single callback with `?error=issuer_missing` before the
// token exchange even ran. `issuer` stays set, so better-auth still catches a
// MISMATCH should Telegram ever start sending the param.

import type { GenericOAuthConfig } from "better-auth/plugins";

export const TELEGRAM_OIDC_DISCOVERY_URL =
  "https://oauth.telegram.org/.well-known/openid-configuration";
export const TELEGRAM_ISSUER = "https://oauth.telegram.org";

/**
 * Minimal profile we derive from a Telegram id_token. Structurally compatible
 * with better-auth's `OAuth2UserInfo` ({ id, name?, email?, image?,
 * emailVerified }).
 */
export type TelegramProfile = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
};

/**
 * Decode a JWT's claim set WITHOUT verifying the signature. Safe here because
 * the id_token is channel-authenticated (TLS + one-time PKCE code); see the
 * trust-model note at the top of this file. Returns null on any malformed
 * input rather than throwing.
 */
export function decodeJwtClaims(
  idToken: string | undefined,
): Record<string, unknown> | null {
  if (!idToken) return null;
  const parts = idToken.split(".");
  if (parts.length < 2) return null;
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const claims = JSON.parse(json) as unknown;
    if (!claims || typeof claims !== "object") return null;
    return claims as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/**
 * Build a Telegram profile from an OIDC id_token. Returns null (→ sign-in
 * rejected) if the token is missing/malformed, expired, from the wrong issuer,
 * issued for a different client, or has no `sub`.
 *
 * @param idToken  the raw JWT from Telegram's token endpoint
 * @param opts.clientId  our bot's OIDC client_id — when set, `aud` must match
 * @param opts.now  injectable clock (ms since epoch) for tests
 */
export function telegramProfileFromIdToken(
  idToken: string | undefined,
  opts: { clientId?: string; now?: number } = {},
): TelegramProfile | null {
  const claims = decodeJwtClaims(idToken);
  if (!claims) return null;

  // Issuer must be Telegram.
  if (asString(claims.iss) !== TELEGRAM_ISSUER) return null;

  // Expiry (`exp` is seconds since epoch, per JWT spec).
  const nowSec = Math.floor((opts.now ?? Date.now()) / 1000);
  if (typeof claims.exp === "number" && claims.exp <= nowSec) return null;

  // Audience must be our client, when both are known. `aud` may be a string or
  // an array of strings per the JWT spec.
  if (opts.clientId) {
    const aud = claims.aud;
    const audOk =
      aud === opts.clientId ||
      (Array.isArray(aud) && aud.includes(opts.clientId));
    if (!audOk) return null;
  }

  const sub = asString(claims.sub);
  if (!sub) return null;

  // Prefer the full name; fall back to given+family, then @username, then a
  // stable synthetic label. All `||` (empty string skips) to avoid ??/|| mixing.
  const joinedName = [asString(claims.given_name), asString(claims.family_name)]
    .filter(Boolean)
    .join(" ");
  const displayName =
    asString(claims.name) ||
    joinedName ||
    asString(claims.preferred_username) ||
    `Telegram ${sub}`;

  return {
    id: sub,
    name: displayName,
    // Synthetic, non-routable, unique-per-identity. Marked verified so
    // sendOnSignUp never emails it; identity is keyed on the account row, not
    // this address.
    email: `tg_${sub}@telegram.local`,
    emailVerified: true,
    image: asString(claims.picture),
  };
}

/**
 * The genericOAuth provider config for Telegram, or null when the feature is
 * not configured (both TELEGRAM_CLIENT_ID and TELEGRAM_CLIENT_SECRET must be
 * set). Null → the plugin is not registered and the "Log in with Telegram"
 * endpoint does not exist, mirroring the lazy Resend pattern in server.ts.
 */
export function telegramGenericOAuthConfig(): GenericOAuthConfig | null {
  const clientId = process.env.TELEGRAM_CLIENT_ID;
  const clientSecret = process.env.TELEGRAM_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  return {
    providerId: "telegram",
    discoveryUrl: TELEGRAM_OIDC_DISCOVERY_URL,
    issuer: TELEGRAM_ISSUER,
    clientId,
    clientSecret,
    scopes: ["openid", "profile"],
    pkce: true,
    // Telegram's token endpoint authenticates the client via HTTP Basic.
    authentication: "basic",
    // No userinfo endpoint — derive the profile from the id_token claims.
    getUserInfo: async (tokens) =>
      telegramProfileFromIdToken(tokens.idToken, { clientId }),
  };
}
