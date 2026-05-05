// Dev-only routes — registered exclusively when NODE_ENV !== 'production'.
//
// `GET /api/dev/verify-tokens?email=<email>`
//   Returns the verification token recorded by the dev-stub
//   `sendVerificationEmail` callback in auth/server.ts (which stashes
//   `{ url, frontendUrl, token }` per email on `globalThis.__verifyTokensByEmail`).
//   Used by the SPA's E2E bridge so Playwright can simulate "user clicks the
//   link in their inbox" without parsing a real email.
//
// In production this file is still imported, but `registerDevRoutes` is a
// no-op — see `buildApp.ts` for the guard. Even so, the route handler itself
// double-checks `NODE_ENV` so a misconfigured deploy never leaks tokens.
import type { FastifyInstance } from "fastify";

type VerifyTokenEntry = { url: string; frontendUrl: string; token: string };
type VerifyTokenMap = Map<string, VerifyTokenEntry>;

function getVerifyTokensMap(): VerifyTokenMap | null {
  const g = globalThis as { __verifyTokensByEmail?: VerifyTokenMap };
  return g.__verifyTokensByEmail ?? null;
}

export async function devRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { email?: string } }>(
    "/verify-tokens",
    async (req, reply) => {
      if (process.env.NODE_ENV === "production") {
        return reply.code(404).send({ error: "not found" });
      }
      const email = req.query.email;
      if (!email) {
        return reply.code(400).send({ error: "email query param is required" });
      }
      const map = getVerifyTokensMap();
      const entry = map?.get(email);
      if (!entry) {
        return reply.code(404).send({ error: `no token for ${email}` });
      }
      return reply.send({ token: entry.token, frontendUrl: entry.frontendUrl });
    },
  );
}
