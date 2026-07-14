// Telegram login via Telegram's official OIDC flow (oauth.telegram.org), wired
// through better-auth's first-party `genericOAuth` plugin. Session transport is
// the same httpOnly cookie as email sign-in: the genericOAuth callback mints the
// session and sets the cookie on the API origin, and the browser carries it home
// on the redirect back to the SPA — no token ever crosses through JS.
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
//  - NO email: Telegram never returns one, and better-auth REQUIRES one — the
//    generic-oauth callback rejects an emailless profile outright
//    (`email_is_missing`) and link-account dereferences `userInfo.email`
//    unconditionally. First-class emailless identity keyed on
//    (providerId, accountId) is upstream #9124, still unmerged as of 1.6.9. So a
//    synthetic placeholder is forced on us; it is not a design choice.
//
//    Do NOT trust that address. better-auth's `findOAuthUser` falls back to a
//    lookup BY EMAIL when no `account` row matches, which once made this
//    placeholder a live account-takeover vector: the local part derives from a
//    PUBLIC number, so an attacker could pre-register it via `/sign-up/email`
//    and inherit the victim's Telegram identity on their next login. Two
//    independent guards now stop that, and both must stay:
//      1. `isSyntheticTelegramEmail` + the sign-up guard in server.ts — nobody
//         outside this flow can own an address in the reserved domain;
//      2. `accountLinking.disableImplicitLinking` in server.ts — email is never
//         a linking key, so even a leaked address cannot merge two identities.
//    Ratchets: __tests__/telegram-synthetic-email.test.ts.
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
 * Reserved namespace for the synthetic addresses this flow mints. `.local` is
 * reserved by RFC 6762 — it can never resolve, so no human can own a mailbox
 * here and no real user can ever collide with one.
 */
export const TELEGRAM_SYNTHETIC_EMAIL_DOMAIN = "telegram.local";

/** The address minted for a Telegram identity. The ONLY place this shape lives. */
export function syntheticTelegramEmail(sub: string): string {
  return `tg_${sub}@${TELEGRAM_SYNTHETIC_EMAIL_DOMAIN}`;
}

/**
 * Does this address belong to the reserved namespace? Guards `/sign-up/email`
 * (see server.ts) so the namespace stays ours.
 *
 * Deliberately matches the whole DOMAIN, not the exact `tg_<sub>` shape a
 * caller would guess from `syntheticTelegramEmail`. The guard must keep holding
 * if that local part ever changes — a predicate coupled to the format would
 * silently stop guarding the day someone reshapes it, which is exactly the
 * divergence that reopens the takeover.
 */
export function isSyntheticTelegramEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  return email
    .trim()
    .toLowerCase()
    .endsWith(`@${TELEGRAM_SYNTHETIC_EMAIL_DOMAIN}`);
}

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
    email: syntheticTelegramEmail(sub),
    // `verified` is a lie we tell to keep `emailVerification.sendOnSignUp` from
    // mailing an unroutable address — nobody verified anything. It used to be
    // load-bearing (better-auth's implicit-link gate reads it), which is what
    // made the takeover possible; `disableImplicitLinking` in server.ts is what
    // took that weight off it. Leaving it true is now inert, not a shortcut.
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
