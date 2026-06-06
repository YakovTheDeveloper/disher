import { FastifyInstance } from "fastify";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, "../../../data/bug-reports");

// dev-only bug-report sink. One JSON file per report in data/bug-reports/, plus
// a sibling <ts>.png/.jpg when the client attached a screenshot dataURL. The
// screenshot is written as a separate image file (not inlined as base64 in the
// JSON) so reports stay human-readable and the image opens directly.
//
// Body is backward-compatible: the original { text, page?, screenSize? } shape
// still works; userAgent/pwa/screenshot are additive and optional.
type BugReportBody = {
  text: string;
  page?: string;
  screenSize?: string;
  userAgent?: string;
  pwa?: string;
  // PNG/JPEG dataURL: "data:image/png;base64,…"
  screenshot?: string;
};

const SCREENSHOT_RE = /^data:image\/(png|jpe?g);base64,([a-zA-Z0-9+/=]+)$/;

export async function bugReportRoutes(app: FastifyInstance) {
  app.post<{ Body: BugReportBody }>("/", async (req, reply) => {
    // Defense-in-depth: this disk-writing route is not registered in prod
    // (see buildApp.ts), but 404 here too so a misconfigured deploy can never
    // write files from anonymous input.
    if (process.env.NODE_ENV === "production") {
      return reply.status(404).send({ error: "not found" });
    }

    const { text, page, screenSize, userAgent, pwa, screenshot } = req.body ?? {};

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return reply.status(400).send({ error: "text is required" });
    }

    await fs.mkdir(REPORTS_DIR, { recursive: true });

    // Server-derived basename (no client influence → no path traversal). The
    // random suffix prevents same-millisecond reports from overwriting each
    // other; the .json and sibling image share it so they stay paired.
    const now = new Date();
    const timestamp = `${now.toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;

    // Decode + persist the screenshot first; on any failure we still write the
    // JSON report (best-effort image, never block the report itself).
    let screenshotFile: string | null = null;
    if (typeof screenshot === "string") {
      const match = SCREENSHOT_RE.exec(screenshot);
      if (match) {
        const ext = match[1].startsWith("jp") ? "jpg" : "png";
        const file = `${timestamp}.${ext}`;
        try {
          await fs.writeFile(
            path.join(REPORTS_DIR, file),
            Buffer.from(match[2], "base64"),
          );
          screenshotFile = file;
        } catch (err) {
          req.log.warn({ err }, "[bug-reports] screenshot write failed");
          screenshotFile = null;
        }
      }
    }

    const report = {
      text: text.trim(),
      page: page ?? null,
      screenSize: screenSize ?? null,
      userAgent: userAgent ?? req.headers["user-agent"] ?? "unknown",
      pwa: pwa ?? null,
      screenshotFile,
      createdAt: now.toISOString(),
    };

    const filename = `${timestamp}.json`;
    await fs.writeFile(
      path.join(REPORTS_DIR, filename),
      JSON.stringify(report, null, 2),
      "utf-8",
    );

    return { ok: true, filename };
  });
}
