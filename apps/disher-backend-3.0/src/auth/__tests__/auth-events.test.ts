import { describe, expect, it } from "vitest";
import { APIError } from "better-auth/api";
import {
  buildAuthEvent,
  classifyAuthResult,
  errorCodeFromRedirect,
  isTrackedAuthPath,
  providerFromContext,
  type AuthHookContext,
} from "../auth-events.js";

// The load-bearing case: better-auth signals a redirect by THROWING
// `APIError("FOUND")`, and the Telegram callback redirects on success as well as
// on failure. Classify by `location` or every successful Telegram login is
// recorded as an error (and, worse, a real failure looks like just another
// redirect).
function redirect(location: string) {
  const headers = new Headers();
  headers.set("location", location);
  return new APIError("FOUND", undefined, headers);
}

describe("classifyAuthResult", () => {
  it("treats a plain returned value as success", () => {
    expect(classifyAuthResult({ token: "x" })).toMatchObject({
      outcome: "success",
      errorCode: null,
    });
  });

  it("treats a redirect WITHOUT ?error as success (Telegram happy path)", () => {
    const result = classifyAuthResult(redirect("https://disher.life/?welcome=1"));
    expect(result.outcome).toBe("success");
    expect(result.errorCode).toBeNull();
  });

  it("treats a redirect WITH ?error as a failure and keeps the code", () => {
    const result = classifyAuthResult(
      redirect("https://disher.life/?error=issuer_missing&error_description=no%20iss"),
    );
    expect(result.outcome).toBe("failure");
    expect(result.errorCode).toBe("issuer_missing");
    expect(result.errorMessage).toBe("no iss");
  });

  it("records an APIError rejection with its better-auth code", () => {
    const result = classifyAuthResult(
      new APIError("UNAUTHORIZED", {
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "Invalid email or password",
      }),
    );
    expect(result).toMatchObject({
      outcome: "failure",
      statusCode: 401,
      errorCode: "INVALID_EMAIL_OR_PASSWORD",
    });
  });

  it("survives a redirect with no error_description", () => {
    expect(classifyAuthResult(redirect("https://disher.life/?error=oauth_code_missing"))).
      toMatchObject({ outcome: "failure", errorCode: "oauth_code_missing", errorMessage: null });
  });
});

describe("errorCodeFromRedirect", () => {
  it("returns null for a clean location and for junk", () => {
    expect(errorCodeFromRedirect("https://disher.life/")).toBeNull();
    expect(errorCodeFromRedirect(null)).toBeNull();
    expect(errorCodeFromRedirect("not a url")).toBeNull();
  });

  it("reads the code off a relative location", () => {
    expect(errorCodeFromRedirect("/?error=state_mismatch")).toBe("state_mismatch");
  });
});

describe("isTrackedAuthPath", () => {
  it("tracks the login surface and skips the noise", () => {
    expect(isTrackedAuthPath("/sign-in/email")).toBe(true);
    expect(isTrackedAuthPath("/oauth2/callback/:providerId")).toBe(true);
    // Fires on every app boot — would bury the failures we're hunting.
    expect(isTrackedAuthPath("/get-session")).toBe(false);
    expect(isTrackedAuthPath(undefined)).toBe(false);
  });
});

describe("buildAuthEvent", () => {
  it("takes the provider from the callback params, not the path template", () => {
    const ctx: AuthHookContext = {
      path: "/oauth2/callback/:providerId",
      params: { providerId: "telegram" },
      context: { returned: redirect("https://disher.life/"), newSession: null },
    };
    expect(providerFromContext(ctx)).toBe("telegram");
  });

  it("keeps the ATTEMPTED email on a failed sign-in (no session exists)", () => {
    const event = buildAuthEvent(
      {
        path: "/sign-in/email",
        body: { email: "typo@exmaple.com", password: "hunter2hunter2" },
        headers: new Headers({ "user-agent": "iPhone" }),
        context: {
          returned: new APIError("UNAUTHORIZED", { code: "INVALID_EMAIL_OR_PASSWORD" }),
          newSession: null,
        },
      },
      "203.0.113.7",
    );

    expect(event).toMatchObject({
      provider: "email",
      outcome: "failure",
      errorCode: "INVALID_EMAIL_OR_PASSWORD",
      email: "typo@exmaple.com",
      userId: null,
      ip: "203.0.113.7",
      userAgent: "iPhone",
    });
  });

  it("takes the user id from the freshly minted session on success", () => {
    const event = buildAuthEvent(
      {
        path: "/oauth2/callback/:providerId",
        params: { providerId: "telegram" },
        context: {
          returned: redirect("https://disher.life/"),
          newSession: {
            user: { id: "0f1b2c3d-0000-4000-8000-000000000001", email: "tg_42@telegram.local" },
          },
        },
      },
      null,
    );

    expect(event).toMatchObject({
      provider: "telegram",
      outcome: "success",
      userId: "0f1b2c3d-0000-4000-8000-000000000001",
      email: "tg_42@telegram.local",
    });
  });

  it("never leaks the password into the row", () => {
    const event = buildAuthEvent(
      {
        path: "/sign-in/email",
        body: { email: "a@b.c", password: "super-secret-password" },
        context: { returned: { token: "t" }, newSession: null },
      },
      null,
    );
    expect(JSON.stringify(event)).not.toContain("super-secret-password");
  });
});
