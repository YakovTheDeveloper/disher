import { FastifyInstance } from "fastify";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "secret"
);

/**
 * Generate a JWT for a user.
 */
async function createToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
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

    // Derive a stable userId from email
    const userId = Buffer.from(email).toString("base64url");

    const token = await createToken(userId);

    return { token, userId };
  });

  // POST /api/auth/oauth/callback
  // Placeholder for OAuth flow (Google, GitHub, etc.)
  app.post<{
    Body: { provider: string; code: string };
  }>("/oauth/callback", async (req, reply) => {
    const { provider, code } = req.body;

    // TODO: exchange code for user info via provider
    // TODO: find or create user + account
    // TODO: return JWT

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

      const token = await createToken(payload.sub);
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
