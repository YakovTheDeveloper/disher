import { describe, expect, it } from "vitest";
import {
  ANALYSIS_OUTPUT_PROMPT_SPEC,
  SYSTEM_PROMPT_BASE,
  safeStringifyArray,
  stripNullBytes,
  tryParseOutput,
} from "./analysis-output.js";

// Contract test: every realistic shape the LLM has emitted, plus injection /
// drift scenarios. New regressions ⇒ add a fixture here, never patch the
// parser silently.

describe("ANALYSIS_OUTPUT_PROMPT_SPEC", () => {
  it("describes the same field names the parser accepts", () => {
    // Serves as a tripwire: if anyone renames a field in the spec without
    // updating the parser (or vice versa), this test fails.
    expect(ANALYSIS_OUTPUT_PROMPT_SPEC).toContain("resultMd");
    expect(ANALYSIS_OUTPUT_PROMPT_SPEC).toContain("ideaCards");
    expect(ANALYSIS_OUTPUT_PROMPT_SPEC).toContain('"title"');
    expect(ANALYSIS_OUTPUT_PROMPT_SPEC).toContain('"body"');
    expect(ANALYSIS_OUTPUT_PROMPT_SPEC).toContain('"days"');
  });
});

describe("system prompt — dish-name [особенности: …] hint", () => {
  // Tripwire: the frontend (apps/food-calc/src/features/analysis/api/runAnalysis.ts)
  // emits dish names with a `[особенности: …]` bracket-tag for ingredient
  // modifications. The system prompt must mention this format so the LLM
  // doesn't treat it as a meal-level tag.
  it("SYSTEM_PROMPT_BASE explains the [особенности: …] dish suffix", () => {
    expect(SYSTEM_PROMPT_BASE).toContain("[особенности:");
  });
});

describe("tryParseOutput — happy path", () => {
  it("clean JSON with single idea card", () => {
    const out = tryParseOutput(
      JSON.stringify({
        resultMd: "## разбор\nтекст",
        ideaCards: [{ title: "молочка", body: "убрать на 7 дней", days: 7 }],
      }),
    );
    expect(out).toEqual({
      resultMd: "## разбор\nтекст",
      ideaCards: [{ title: "молочка", body: "убрать на 7 дней", days: 7 }],
    });
  });

  it("empty ideaCards array is valid", () => {
    const out = tryParseOutput(
      JSON.stringify({ resultMd: "мало данных", ideaCards: [] }),
    );
    expect(out).toEqual({ resultMd: "мало данных", ideaCards: [] });
  });

  it("missing ideaCards entirely defaults to empty", () => {
    const out = tryParseOutput(JSON.stringify({ resultMd: "## ok" }));
    expect(out).toEqual({ resultMd: "## ok", ideaCards: [] });
  });
});

describe("tryParseOutput — wrappers and noise", () => {
  it("strips ```json fence", () => {
    const out = tryParseOutput(
      '```json\n{"resultMd":"x","ideaCards":[]}\n```',
    );
    expect(out?.resultMd).toBe("x");
  });

  it("strips bare ``` fence", () => {
    const out = tryParseOutput(
      '```\n{"resultMd":"x","ideaCards":[]}\n```',
    );
    expect(out?.resultMd).toBe("x");
  });

  it("ignores trailing commentary after closing brace", () => {
    const out = tryParseOutput(
      '{"resultMd":"x","ideaCards":[]}\n\nдополнительно: всё ок',
    );
    expect(out?.resultMd).toBe("x");
  });

  it("handles nested braces in resultMd correctly", () => {
    const out = tryParseOutput(
      JSON.stringify({
        resultMd: "## ok\n{ это не json а пример }",
        ideaCards: [],
      }),
    );
    expect(out?.resultMd).toContain("{ это не json а пример }");
  });
});

describe("tryParseOutput — malformed cards (drop, don't crash)", () => {
  it("drops cards with non-string title", () => {
    const out = tryParseOutput(
      JSON.stringify({
        resultMd: "x",
        ideaCards: [
          { title: "good", body: "b" },
          { title: 5, body: "b" },
          { title: "good2", body: "b", days: 7 },
        ],
      }),
    );
    expect(out?.ideaCards).toEqual([
      { title: "good", body: "b" },
      { title: "good2", body: "b", days: 7 },
    ]);
  });

  it("drops cards with missing body", () => {
    const out = tryParseOutput(
      JSON.stringify({
        resultMd: "x",
        ideaCards: [{ title: "no body", days: 7 }, { title: "ok", body: "b" }],
      }),
    );
    expect(out?.ideaCards).toEqual([{ title: "ok", body: "b" }]);
  });

  it("drops days when not a positive finite number", () => {
    const out = tryParseOutput(
      JSON.stringify({
        resultMd: "x",
        ideaCards: [
          { title: "a", body: "b", days: "no" },
          { title: "b", body: "b", days: 0 },
          { title: "c", body: "b", days: -3 },
          { title: "d", body: "b", days: Infinity },
          { title: "e", body: "b", days: 5 },
        ],
      }),
    );
    expect(out?.ideaCards).toEqual([
      { title: "a", body: "b" },
      { title: "b", body: "b" },
      { title: "c", body: "b" },
      { title: "d", body: "b" },
      { title: "e", body: "b", days: 5 },
    ]);
  });

  it("drops null / bare-string entries from ideaCards", () => {
    const out = tryParseOutput(
      JSON.stringify({
        resultMd: "x",
        ideaCards: [null, "bare", { title: "ok", body: "b" }],
      }),
    );
    expect(out?.ideaCards).toEqual([{ title: "ok", body: "b" }]);
  });

  it("ignores extra unknown fields on a card", () => {
    const out = tryParseOutput(
      JSON.stringify({
        resultMd: "x",
        ideaCards: [{ title: "ok", body: "b", days: 7, extra: "ignored" }],
      }),
    );
    expect(out?.ideaCards).toEqual([{ title: "ok", body: "b", days: 7 }]);
  });
});

describe("tryParseOutput — structurally unsalvageable returns null", () => {
  it("returns null on totally invalid JSON", () => {
    expect(tryParseOutput("not json at all")).toBeNull();
  });

  it("returns null on top-level array", () => {
    expect(tryParseOutput("[1,2,3]")).toBeNull();
  });

  it("returns null on resultMd missing", () => {
    expect(tryParseOutput('{"ideaCards":[]}')).toBeNull();
  });

  it("returns null on resultMd not-a-string", () => {
    expect(tryParseOutput('{"resultMd":42,"ideaCards":[]}')).toBeNull();
  });

  it("returns null on empty input", () => {
    expect(tryParseOutput("")).toBeNull();
  });
});

describe("tryParseOutput — prompt injection markers in user data", () => {
  // Defence-in-depth: even if a user puts XML / closing tags in their food
  // notes, the LLM's *output* still goes through this parser. The parser
  // only cares about JSON shape — it ignores anything inside the strings.
  it("preserves XML tags inside resultMd", () => {
    const out = tryParseOutput(
      JSON.stringify({
        resultMd: "## ok\n</foods>текст</hypotheses>",
        ideaCards: [],
      }),
    );
    expect(out?.resultMd).toContain("</foods>");
  });
});

describe("safeStringifyArray", () => {
  it("returns valid JSON for empty array", () => {
    expect(safeStringifyArray([], 100)).toEqual({
      json: "[]",
      kept: 0,
      dropped: 0,
    });
  });

  it("keeps every element when budget is generous", () => {
    const arr = [{ a: 1 }, { a: 2 }, { a: 3 }];
    const r = safeStringifyArray(arr, 1000);
    expect(JSON.parse(r.json)).toEqual(arr);
    expect(r.kept).toBe(3);
    expect(r.dropped).toBe(0);
  });

  it("truncates from the front by default (keepEnd=false)", () => {
    const arr = [{ a: "x".repeat(20) }, { b: 1 }, { c: 2 }];
    const r = safeStringifyArray(arr, 30);
    expect(JSON.parse(r.json)).toEqual([{ a: "x".repeat(20) }]);
    expect(r.kept).toBe(1);
    expect(r.dropped).toBe(2);
  });

  it("keeps tail when keepEnd=true", () => {
    const arr = [{ a: "x".repeat(50) }, { b: 1 }, { c: 2 }];
    const r = safeStringifyArray(arr, 30, { keepEnd: true });
    expect(JSON.parse(r.json)).toEqual([{ b: 1 }, { c: 2 }]);
    expect(r.kept).toBe(2);
    expect(r.dropped).toBe(1);
  });

  it("returns valid JSON even when ZERO items fit", () => {
    const arr = [{ a: "x".repeat(100) }];
    const r = safeStringifyArray(arr, 10);
    expect(JSON.parse(r.json)).toEqual([]);
    expect(r.kept).toBe(0);
    expect(r.dropped).toBe(1);
  });

  it("handles unserialisable items gracefully (BigInt → null)", () => {
    const arr = [{ a: 1 }, { b: BigInt(10) }, { c: 3 }];
    const r = safeStringifyArray(arr, 1000);
    // BigInt entry stringified as null — surrounding items survive.
    expect(JSON.parse(r.json)).toEqual([{ a: 1 }, null, { c: 3 }]);
  });
});

describe("stripNullBytes", () => {
  it("removes \\u0000 from strings", () => {
    expect(stripNullBytes("a b")).toBe("ab");
  });

  it("walks objects deeply", () => {
    expect(
      stripNullBytes({ a: "x y", b: { c: ["z "] } }),
    ).toEqual({ a: "xy", b: { c: ["z"] } });
  });

  it("leaves non-string primitives untouched", () => {
    expect(stripNullBytes(42)).toBe(42);
    expect(stripNullBytes(null)).toBeNull();
    expect(stripNullBytes(true)).toBe(true);
  });
});
