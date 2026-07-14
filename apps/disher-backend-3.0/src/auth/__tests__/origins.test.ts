import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isTrustedOrigin, staticAllowedOrigins } from "../origins.js";

// The one allowlist feeds THREE consumers (CORS, better-auth trustedOrigins, and
// requireTrustedOrigin), so a hole here is a hole in all of them at once. The
// production branch is the one that matters and the one nothing else exercises:
// every other test in this repo runs under NODE_ENV=test, where the LAN echo is
// deliberately open. `isProd()` is the only thing standing between "echo any
// RFC1918 origin on :5173" and production.

describe("origins allowlist", () => {
  const saved = {
    NODE_ENV: process.env.NODE_ENV,
    FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
    BETTER_AUTH_TRUSTED_ORIGINS: process.env.BETTER_AUTH_TRUSTED_ORIGINS,
  };

  beforeEach(() => {
    delete process.env.FRONTEND_ORIGIN;
    delete process.env.BETTER_AUTH_TRUSTED_ORIGINS;
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  describe("in production", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("trusts exactly what the env lists", () => {
      process.env.FRONTEND_ORIGIN = "https://disher.life";
      process.env.BETTER_AUTH_TRUSTED_ORIGINS = "https://admin.disher.life";

      expect(isTrustedOrigin("https://disher.life")).toBe(true);
      expect(isTrustedOrigin("https://admin.disher.life")).toBe(true);
      expect(isTrustedOrigin("https://evil.example")).toBe(false);
    });

    // The LAN echo is a dev affordance (the dev box's IP varies per machine). If
    // it ever leaked into prod, anyone able to reach the API from an RFC1918
    // address — a co-tenant on the shared box, say — would be a trusted origin.
    it("does NOT echo a LAN origin", () => {
      process.env.FRONTEND_ORIGIN = "https://disher.life";

      expect(isTrustedOrigin("http://192.168.1.50:5173")).toBe(false);
      expect(isTrustedOrigin("http://10.0.0.5:5173")).toBe(false);
      expect(isTrustedOrigin("http://localhost:5173")).toBe(false);
    });

    // Fail CLOSED: a missing FRONTEND_ORIGIN must block everything, never trust
    // everything. buildApp warns loudly about this at boot.
    it("trusts nothing when the env lists nothing", () => {
      expect(staticAllowedOrigins()).toEqual([]);
      expect(isTrustedOrigin("https://disher.life")).toBe(false);
    });

    it("rejects an absent origin", () => {
      process.env.FRONTEND_ORIGIN = "https://disher.life";

      expect(isTrustedOrigin(undefined)).toBe(false);
      expect(isTrustedOrigin("")).toBe(false);
    });
  });

  describe("in dev", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("echoes a LAN origin on the vite ports, and only those", () => {
      expect(isTrustedOrigin("http://192.168.1.50:5173")).toBe(true);
      expect(isTrustedOrigin("https://10.0.0.5:4173")).toBe(true);
      // A LAN host on some other port is not a vite dev server — no reason to trust it.
      expect(isTrustedOrigin("http://192.168.1.50:8080")).toBe(false);
      // Public IPs are not RFC1918 and never match, port notwithstanding.
      expect(isTrustedOrigin("http://8.8.8.8:5173")).toBe(false);
      expect(isTrustedOrigin("https://evil.example")).toBe(false);
    });

    it("still trusts the static localhost entries", () => {
      expect(isTrustedOrigin("https://localhost:5173")).toBe(true);
    });
  });
});
