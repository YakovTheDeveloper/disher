import { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";

// ─── Types ───

interface ShareItem {
  productId: string;
  name: string;
  quantity: number;
}

interface SharePayload {
  items: ShareItem[];
  source: { type: "dish" | "day"; name: string };
  senderName?: string;
  createdAt: string;
}

interface CreateShareRequest {
  items: ShareItem[];
  source: { type: "dish" | "day"; name: string };
  senderName?: string;
}

// ─── Storage (in-memory with TTL) ───

const SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const shares = new Map<string, SharePayload>();

// Cleanup expired shares every hour
setInterval(() => {
  const now = Date.now();
  for (const [id, payload] of shares) {
    const createdMs = new Date(payload.createdAt).getTime();
    if (now - createdMs > SHARE_TTL_MS) {
      shares.delete(id);
    }
  }
}, 60 * 60 * 1000);

// ─── Routes ───

export async function shareRoutes(app: FastifyInstance) {
  // POST /api/shares — create a share link
  app.post<{ Body: CreateShareRequest }>("/", async (req, reply) => {
    const { items, source, senderName } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return reply.status(400).send({ error: "items array is required and must not be empty" });
    }

    if (!source || !source.type || !source.name) {
      return reply.status(400).send({ error: "source with type and name is required" });
    }

    const shareId = randomUUID();

    shares.set(shareId, {
      items,
      source,
      senderName,
      createdAt: new Date().toISOString(),
    });

    return { shareId };
  });

  // GET /api/shares/:id — retrieve a share payload
  app.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const { id } = req.params;
    const payload = shares.get(id);

    if (!payload) {
      return reply.status(404).send({ error: "Share not found or expired" });
    }

    // Check TTL
    const age = Date.now() - new Date(payload.createdAt).getTime();
    if (age > SHARE_TTL_MS) {
      shares.delete(id);
      return reply.status(404).send({ error: "Share expired" });
    }

    return payload;
  });
}
