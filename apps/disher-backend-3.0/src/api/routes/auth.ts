import { FastifyInstance } from "fastify";
import { SignJWT } from "jose";

// Same secret as Triplit dev server uses
// In production: use env variable TRIPLIT_JWT_SECRET
const JWT_SECRET = new TextEncoder().encode(
  process.env.TRIPLIT_JWT_SECRET ?? "secret"
);

const PROJECT_ID = process.env.TRIPLIT_PROJECT_ID ?? "local-project-id";

/**
 * Generate a Triplit-compatible JWT for a user.
 * The token contains:
 * - sub: userId (used by Triplit roles to match $userId)
 * - x-triplit-project-id: project identifier
 * - x-triplit-token-type: "external" for user tokens
 */
async function createTriplitToken(userId: string): Promise<string> {
  return new SignJWT({
    sub: userId,
    "x-triplit-project-id": PROJECT_ID,
    "x-triplit-token-type": "external",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  // For now: simple email-based login (replace with OAuth later)
  app.post<{
    Body: { email: string; name?: string };
  }>("/login", async (req, reply) => {
    const { email, name } = req.body;

    if (!email) {
      return reply.status(400).send({ error: "Email is required" });
    }

    // TODO: look up or create user in Triplit via service token
    // For now, derive a stable userId from email
    const userId = Buffer.from(email).toString("base64url");

    const token = await createTriplitToken(userId);

    return { token, userId };
  });

  // POST /api/auth/oauth/callback
  // Placeholder for OAuth flow (Google, GitHub, etc.)
  app.post<{
    Body: { provider: string; code: string };
  }>("/oauth/callback", async (req, reply) => {
    const { provider, code } = req.body;

    // TODO: exchange code for user info via provider
    // TODO: find or create user + account in Triplit
    // TODO: return Triplit JWT

    return reply
      .status(501)
      .send({ error: "OAuth not implemented yet", provider });
  });

  // POST /api/auth/refresh — issue a fresh token from a valid (or recently expired) one
  app.post("/refresh", async (req, reply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "No token provided" });
    }

    const oldToken = authHeader.slice(7);
    try {
      // Decode without verifying expiry — allows refreshing recently expired tokens
      const payload = JSON.parse(
        Buffer.from(oldToken.split(".")[1], "base64url").toString()
      );
      if (!payload.sub) {
        return reply.status(401).send({ error: "Invalid token: no sub claim" });
      }

      const token = await createTriplitToken(payload.sub);
      return { token, userId: payload.sub };
    } catch {
      return reply.status(401).send({ error: "Invalid token" });
    }
  });

  // GET /api/auth/me — validate token and return user info
  app.get("/me", async (req, reply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "No token provided" });
    }

    // TODO: verify JWT and return user data
    return reply.status(501).send({ error: "Not implemented yet" });
  });
}
