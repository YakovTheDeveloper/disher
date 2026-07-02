import { describe, it, expect } from "vitest";
import {
  AppError,
  toProblem,
  badRequest,
  unprocessable,
  aiProviderError,
  aiTimeout,
} from "../errors.js";

const INSTANCE = "req-abc";

describe("toProblem", () => {
  it("renders a 4xx AppError with status/code/title/detail", () => {
    const p = toProblem(badRequest("age must be a number"), { instance: INSTANCE, exposeDetail: false });
    expect(p).toMatchObject({
      status: 400,
      code: "bad_request",
      title: "Bad Request",
      detail: "age must be a number", // 4xx detail is client-actionable — kept
      instance: INSTANCE,
    });
  });

  it("keeps flat extensions (fieldErrors / retryAfter) as top-level members", () => {
    const p = toProblem(unprocessable({ email: "invalid" }), { instance: INSTANCE, exposeDetail: false });
    expect(p.code).toBe("unprocessable");
    expect(p.status).toBe(422);
    expect(p.fieldErrors).toEqual({ email: "invalid" });

    const t = toProblem(aiTimeout(), { instance: INSTANCE, exposeDetail: false });
    expect(t.code).toBe("ai_timeout");
    expect(t.status).toBe(504);
    expect(t.retryAfter).toBe(5);
  });

  it("STRIPS 5xx detail in production (only the instance id crosses the wire)", () => {
    const err = aiProviderError("OpenRouter error 500");
    const prod = toProblem(err, { instance: INSTANCE, exposeDetail: false });
    expect(prod.status).toBe(502);
    expect(prod.code).toBe("ai_provider_error");
    expect(prod.detail).toBeUndefined();
    expect(prod.instance).toBe(INSTANCE);

    const dev = toProblem(err, { instance: INSTANCE, exposeDetail: true });
    expect(dev.detail).toBe("OpenRouter error 500");
  });

  it("never serializes a stack for a raw Error (internal_error 500)", () => {
    const p = toProblem(new Error("boom with SECRET internals"), { instance: INSTANCE, exposeDetail: false });
    expect(p.status).toBe(500);
    expect(p.code).toBe("internal_error");
    expect(p.detail).toBeUndefined();
    const serialized = JSON.stringify(p);
    expect(serialized).not.toContain("SECRET");
    expect(serialized).not.toMatch(/"stack"/);
  });

  it("maps a Fastify-style { statusCode } error to the matching code", () => {
    const p = toProblem({ statusCode: 404, message: "not here" }, { instance: INSTANCE, exposeDetail: false });
    expect(p.code).toBe("not_found");
    expect(p.status).toBe(404);
    expect(p.detail).toBe("not here"); // 4xx — kept
  });

  it("AppError defaults status from the code", () => {
    expect(new AppError("rate_limited").status).toBe(429);
    expect(new AppError("forbidden").status).toBe(403);
  });
});
