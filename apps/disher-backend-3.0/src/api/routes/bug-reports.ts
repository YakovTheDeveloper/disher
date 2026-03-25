import { FastifyInstance } from "fastify";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, "../../../data/bug-reports");

export async function bugReportRoutes(app: FastifyInstance) {
  app.post<{ Body: { text: string; page?: string; screenSize?: string } }>("/", async (req, reply) => {
    const { text, page, screenSize } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return reply.status(400).send({ error: "text is required" });
    }

    await fs.mkdir(REPORTS_DIR, { recursive: true });

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    const filename = `${timestamp}.json`;

    const report = {
      text: text.trim(),
      page: page ?? null,
      screenSize: screenSize ?? null,
      createdAt: now.toISOString(),
      userAgent: req.headers["user-agent"] ?? "unknown",
    };

    await fs.writeFile(
      path.join(REPORTS_DIR, filename),
      JSON.stringify(report, null, 2),
      "utf-8"
    );

    return { ok: true };
  });
}
