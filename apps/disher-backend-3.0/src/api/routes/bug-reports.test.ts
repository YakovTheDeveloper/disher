import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import fs from "fs/promises";

const { bugReportRoutes } = await import("./bug-reports.js");

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify();
  await app.register(bugReportRoutes, { prefix: "/api/bug-reports" });
  await app.ready();
  return app;
}

const url = "/api/bug-reports/";

// 1×1 transparent PNG (smallest valid base64 PNG).
const PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const JPEG_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKpgAA//2Q==";

// Pull the JSON report out of the writeFile spy by finding the *.json call.
function readWrittenReport(spy: ReturnType<typeof vi.spyOn>) {
  const jsonCall = spy.mock.calls.find((c) => String(c[0]).endsWith(".json"));
  if (!jsonCall) throw new Error("no .json write recorded");
  return JSON.parse(jsonCall[1] as string);
}

beforeEach(() => {
  // Default: stub fs so tests never touch the real filesystem.
  vi.spyOn(fs, "mkdir").mockResolvedValue(undefined as never);
  vi.spyOn(fs, "writeFile").mockResolvedValue(undefined as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/bug-reports — production gate", () => {
  it("404s and writes nothing when NODE_ENV=production", async () => {
    const writeSpy = fs.writeFile as unknown as ReturnType<typeof vi.spyOn>;
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const app = await buildApp();
      const res = await app.inject({ method: "POST", url, payload: { text: "report" } });
      expect(res.statusCode).toBe(404);
      expect(writeSpy).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = prev;
    }
  });
});

describe("POST /api/bug-reports — validation", () => {
  it("400 on empty body (no text)", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url, payload: {} });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: "text is required" });
  });

  it("400 on whitespace-only text", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url, payload: { text: "   " } });
    expect(res.statusCode).toBe(400);
  });

  it("does not write any file when validation fails", async () => {
    const writeSpy = fs.writeFile as unknown as ReturnType<typeof vi.spyOn>;
    const app = await buildApp();
    await app.inject({ method: "POST", url, payload: { text: "" } });
    expect(writeSpy).not.toHaveBeenCalled();
  });
});

describe("POST /api/bug-reports — success (text only)", () => {
  it("200 + writes a single JSON file with all fields, screenshotFile null", async () => {
    const writeSpy = fs.writeFile as unknown as ReturnType<typeof vi.spyOn>;
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url,
      payload: {
        text: "  кнопка не нажимается  ",
        page: "/dish/123",
        screenSize: "390x844",
        userAgent: "CustomUA/1.0",
        pwa: "standalone=true display-mode=standalone",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true });
    expect(res.json().filename).toMatch(/\.json$/);

    // Exactly one write (JSON), no image.
    expect(writeSpy).toHaveBeenCalledTimes(1);
    const report = readWrittenReport(writeSpy);
    expect(report).toMatchObject({
      text: "кнопка не нажимается", // trimmed
      page: "/dish/123",
      screenSize: "390x844",
      userAgent: "CustomUA/1.0",
      pwa: "standalone=true display-mode=standalone",
      screenshotFile: null,
    });
    expect(typeof report.createdAt).toBe("string");
  });

  it("falls back to the request user-agent header when body omits it", async () => {
    const writeSpy = fs.writeFile as unknown as ReturnType<typeof vi.spyOn>;
    const app = await buildApp();
    await app.inject({
      method: "POST",
      url,
      payload: { text: "report" },
      headers: { "user-agent": "HeaderUA/9" },
    });
    const report = readWrittenReport(writeSpy);
    expect(report.userAgent).toBe("HeaderUA/9");
  });
});

describe("POST /api/bug-reports — screenshot", () => {
  it("writes a sibling PNG and points screenshotFile at it (no base64 in JSON)", async () => {
    const writeSpy = fs.writeFile as unknown as ReturnType<typeof vi.spyOn>;
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url,
      payload: { text: "with shot", screenshot: PNG_DATA_URL },
    });

    expect(res.statusCode).toBe(200);
    expect(writeSpy).toHaveBeenCalledTimes(2); // png + json

    const pngCall = writeSpy.mock.calls.find((c) => String(c[0]).endsWith(".png"));
    expect(pngCall).toBeDefined();
    expect(Buffer.isBuffer(pngCall![1])).toBe(true);

    const report = readWrittenReport(writeSpy);
    expect(report.screenshotFile).toMatch(/\.png$/);
    // The image bytes must NOT be inlined into the JSON.
    expect(JSON.stringify(report)).not.toContain("base64");
  });

  it("uses a .jpg extension for JPEG dataURLs", async () => {
    const writeSpy = fs.writeFile as unknown as ReturnType<typeof vi.spyOn>;
    const app = await buildApp();
    await app.inject({
      method: "POST",
      url,
      payload: { text: "jpeg shot", screenshot: JPEG_DATA_URL },
    });
    const report = readWrittenReport(writeSpy);
    expect(report.screenshotFile).toMatch(/\.jpg$/);
  });

  it("ignores a malformed screenshot string (JSON only, screenshotFile null)", async () => {
    const writeSpy = fs.writeFile as unknown as ReturnType<typeof vi.spyOn>;
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url,
      payload: { text: "bad shot", screenshot: "not-a-data-url" },
    });

    expect(res.statusCode).toBe(200);
    expect(writeSpy).toHaveBeenCalledTimes(1); // JSON only, no image write
    const report = readWrittenReport(writeSpy);
    expect(report.screenshotFile).toBeNull();
  });

  it("still writes the JSON report when the image write fails", async () => {
    // Reject only the image write; let the JSON write succeed.
    const writeSpy = vi
      .spyOn(fs, "writeFile")
      .mockImplementation(async (p: unknown) => {
        if (String(p).endsWith(".png")) throw new Error("disk full");
        return undefined as never;
      });

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url,
      payload: { text: "shot fails", screenshot: PNG_DATA_URL },
    });

    expect(res.statusCode).toBe(200);
    const report = readWrittenReport(writeSpy);
    expect(report.screenshotFile).toBeNull();
  });
});
