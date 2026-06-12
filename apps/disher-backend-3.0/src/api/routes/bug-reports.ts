import { FastifyInstance, FastifyReply } from "fastify";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, "../../../data/bug-reports");
const STATUS_FILE = path.join(REPORTS_DIR, "status.md");

// Seeded on first read so the dev always has a file to edit on disk. The app
// renders this read-only; the work-status board itself is maintained on the
// backend (edit data/bug-reports/status.md by hand).
const STATUS_TEMPLATE = `# Статус баг-репортов

## 🔧 В процессе

_(пока пусто)_

## ✅ Выполнено

_(пока пусто)_

## 🆕 Не приступил

_(пока пусто)_
`;

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

type StoredReport = {
  text: string;
  page: string | null;
  screenSize: string | null;
  userAgent: string;
  pwa: string | null;
  screenshotFile: string | null;
  createdAt: string;
};

const SCREENSHOT_RE = /^data:image\/(png|jpe?g|webp);base64,([a-zA-Z0-9+/=]+)$/;

// dataURL mime → on-disk extension.
function mimeExt(mime: string): "png" | "jpg" | "webp" {
  if (mime === "webp") return "webp";
  if (mime.startsWith("jp")) return "jpg";
  return "png";
}

// Only ever serve/delete a server-generated basename. Reject anything with a
// path separator or `..` so a crafted :file/:filename can't escape REPORTS_DIR.
// Server names are `<ISO-with-:.replaced-by-->-<uuid8>.<ext>`.
const SAFE_NAME_RE = /^[A-Za-z0-9._-]+$/;

function isSafeName(name: string): boolean {
  return (
    typeof name === "string" &&
    SAFE_NAME_RE.test(name) &&
    !name.includes("..") &&
    path.basename(name) === name
  );
}

// Defense-in-depth: these disk-touching routes are not registered in prod (see
// buildApp.ts), but 404 here too so a misconfigured deploy can never read/write/
// delete files from anonymous input.
function prodBlocked(reply: FastifyReply): boolean {
  if (process.env.NODE_ENV === "production") {
    reply.status(404).send({ error: "not found" });
    return true;
  }
  return false;
}

export async function bugReportRoutes(app: FastifyInstance) {
  app.post<{ Body: BugReportBody }>("/", async (req, reply) => {
    if (prodBlocked(reply)) return;

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
        const ext = mimeExt(match[1]);
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

    const report: StoredReport = {
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

  // List every stored report, newest first. Corrupt/half-written JSON files are
  // skipped rather than failing the whole listing. A missing dir → empty list.
  app.get("/", async (_req, reply) => {
    if (prodBlocked(reply)) return;

    let names: string[];
    try {
      names = await fs.readdir(REPORTS_DIR);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return { reports: [] };
      throw err;
    }

    const jsonNames = names.filter((n) => n.endsWith(".json"));
    const reports = (
      await Promise.all(
        jsonNames.map(async (filename) => {
          try {
            const raw = await fs.readFile(path.join(REPORTS_DIR, filename), "utf-8");
            const data = JSON.parse(raw) as StoredReport;
            return { filename, ...data };
          } catch {
            return null; // skip unreadable/corrupt file
          }
        }),
      )
    ).filter((r): r is { filename: string } & StoredReport => r !== null);

    // Newest first. createdAt is an ISO string → lexicographic == chronological;
    // fall back to filename (also timestamp-prefixed) when createdAt is missing.
    reports.sort((a, b) =>
      (b.createdAt ?? b.filename).localeCompare(a.createdAt ?? a.filename),
    );

    return { reports };
  });

  // Read the work-status markdown board (read-only in the app). Seeds the
  // template on first read so there's always a file to maintain on disk.
  app.get("/status", async (_req, reply) => {
    if (prodBlocked(reply)) return;

    try {
      const md = await fs.readFile(STATUS_FILE, "utf-8");
      return { md };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        await fs.mkdir(REPORTS_DIR, { recursive: true });
        await fs.writeFile(STATUS_FILE, STATUS_TEMPLATE, "utf-8");
        return { md: STATUS_TEMPLATE };
      }
      throw err;
    }
  });

  // Serve a report's screenshot bytes for the in-app list preview.
  app.get<{ Params: { file: string } }>("/image/:file", async (req, reply) => {
    if (prodBlocked(reply)) return;

    const { file } = req.params;
    if (!isSafeName(file) || !/\.(png|jpe?g|webp)$/.test(file)) {
      return reply.status(400).send({ error: "bad file name" });
    }

    let bytes: Buffer;
    try {
      bytes = await fs.readFile(path.join(REPORTS_DIR, file));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return reply.status(404).send({ error: "not found" });
      }
      throw err;
    }

    const type = file.endsWith(".png")
      ? "image/png"
      : file.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";
    return reply.header("Content-Type", type).send(bytes);
  });

  // Hard-delete a report: remove the JSON and its sibling screenshot (if any).
  app.delete<{ Params: { filename: string } }>("/:filename", async (req, reply) => {
    if (prodBlocked(reply)) return;

    const { filename } = req.params;
    if (!isSafeName(filename) || !filename.endsWith(".json")) {
      return reply.status(400).send({ error: "bad file name" });
    }

    const jsonPath = path.join(REPORTS_DIR, filename);

    // Read first so we know which image to delete; 404 if the report is gone.
    let report: StoredReport;
    try {
      report = JSON.parse(await fs.readFile(jsonPath, "utf-8")) as StoredReport;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return reply.status(404).send({ error: "not found" });
      }
      throw err;
    }

    await fs.rm(jsonPath, { force: true });
    // Best-effort image delete: a report with a missing image still deletes OK.
    if (report.screenshotFile && isSafeName(report.screenshotFile)) {
      await fs
        .rm(path.join(REPORTS_DIR, report.screenshotFile), { force: true })
        .catch((err) => req.log.warn({ err }, "[bug-reports] image delete failed"));
    }

    return { ok: true };
  });
}
