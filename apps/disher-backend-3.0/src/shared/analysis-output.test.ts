import { describe, expect, it } from "vitest";
import {
  ANALYSIS_OUTPUT_PROMPT_SPEC,
  SYSTEM_PROMPT_BASE,
  asNutrientLines,
  nutrientLineToken,
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
    expect(ANALYSIS_OUTPUT_PROMPT_SPEC).toContain("summary");
    expect(ANALYSIS_OUTPUT_PROMPT_SPEC).toContain("insights");
    expect(ANALYSIS_OUTPUT_PROMPT_SPEC).toContain("hypotheses");
    expect(ANALYSIS_OUTPUT_PROMPT_SPEC).toContain("evidence");
    expect(ANALYSIS_OUTPUT_PROMPT_SPEC).toContain("strength");
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

  it("SYSTEM_PROMPT_BASE carries the nutrient-anchor instruction", () => {
    expect(SYSTEM_PROMPT_BASE).toContain("ОРИЕНТИРОВОЧНЫЕ суммы нутриентов");
    expect(SYSTEM_PROMPT_BASE).toContain("НЕ превращай ответ в таблицу БЖУ");
  });
});

describe("asNutrientLines", () => {
  it("keeps well-formed lines and coerces a missing norm to null", () => {
    expect(
      asNutrientLines([
        { name: "Белки", amount: 95, unit: "г", norm: 51 },
        { name: "Цинк", amount: 6.2, unit: "мг" },
      ]),
    ).toEqual([
      { name: "Белки", amount: 95, unit: "г", norm: 51 },
      { name: "Цинк", amount: 6.2, unit: "мг", norm: null },
    ]);
  });

  it("drops entries with no name or a non-finite amount", () => {
    expect(
      asNutrientLines([
        { amount: 10, unit: "г" },
        { name: "Железо", amount: Number.NaN, unit: "мг" },
        { name: "Кальций", amount: 800, unit: "мг", norm: 700 },
      ]),
    ).toEqual([{ name: "Кальций", amount: 800, unit: "мг", norm: 700 }]);
  });

  it("returns [] for non-array input", () => {
    expect(asNutrientLines(undefined)).toEqual([]);
    expect(asNutrientLines("nope")).toEqual([]);
  });
});

describe("nutrientLineToken", () => {
  it("appends the norm anchor when present", () => {
    expect(
      nutrientLineToken({ name: "Белки", amount: 95, unit: "г", norm: 51 }),
    ).toBe("Белки 95 г (норма ~51)");
  });

  it("omits the norm clause when null", () => {
    expect(
      nutrientLineToken({ name: "Цинк", amount: 6.2, unit: "мг", norm: null }),
    ).toBe("Цинк 6.2 мг");
  });
});

const INSIGHT = {
  title: "Поздние ужины",
  detail: "Ужин после 21:00 в части дней.",
  strength: "moderate",
  evidence: { days: ["09-06-2026", "10-06-2026"], events: ["усталость"] },
};

describe("tryParseOutput — happy path", () => {
  it("clean JSON with summary + insight + hypothesis", () => {
    const out = tryParseOutput(
      JSON.stringify({
        summary: "## разбор\nтекст",
        insights: [INSIGHT],
        hypotheses: [{ title: "молочка", body: "убрать на 7 дней", suggestedDays: 7 }],
      }),
    );
    expect(out).toEqual({
      summary: "## разбор\nтекст",
      insights: [
        {
          title: "Поздние ужины",
          detail: "Ужин после 21:00 в части дней.",
          strength: "moderate",
          evidence: { days: ["09-06-2026", "10-06-2026"], events: ["усталость"] },
        },
      ],
      hypotheses: [{ title: "молочка", body: "убрать на 7 дней", suggestedDays: 7 }],
    });
  });

  it("empty insights/hypotheses arrays are valid", () => {
    const out = tryParseOutput(
      JSON.stringify({ summary: "мало данных", insights: [], hypotheses: [] }),
    );
    expect(out).toEqual({ summary: "мало данных", insights: [], hypotheses: [] });
  });

  it("missing insights/hypotheses entirely default to empty", () => {
    const out = tryParseOutput(JSON.stringify({ summary: "ok" }));
    expect(out).toEqual({ summary: "ok", insights: [], hypotheses: [] });
  });

  it("coerces unknown strength to weak", () => {
    const out = tryParseOutput(
      JSON.stringify({
        summary: "s",
        insights: [{ ...INSIGHT, strength: "bananas" }],
      }),
    );
    expect(out?.insights[0]?.strength).toBe("weak");
  });
});

describe("tryParseOutput — wrappers and noise", () => {
  it("strips ```json fence", () => {
    const out = tryParseOutput('```json\n{"summary":"x"}\n```');
    expect(out?.summary).toBe("x");
  });

  it("strips bare ``` fence", () => {
    const out = tryParseOutput('```\n{"summary":"x"}\n```');
    expect(out?.summary).toBe("x");
  });

  it("ignores trailing commentary after closing brace", () => {
    const out = tryParseOutput('{"summary":"x"}\n\nдополнительно: всё ок');
    expect(out?.summary).toBe("x");
  });

  it("handles nested braces in summary correctly", () => {
    const out = tryParseOutput(
      JSON.stringify({ summary: "## ok\n{ это не json а пример }" }),
    );
    expect(out?.summary).toContain("{ это не json а пример }");
  });
});

describe("tryParseOutput — grounding gate (insight needs evidence.days)", () => {
  it("drops an insight with no evidence at all", () => {
    const out = tryParseOutput(
      JSON.stringify({
        summary: "s",
        insights: [{ title: "t", detail: "d", strength: "clear" }],
      }),
    );
    expect(out?.insights).toEqual([]);
  });

  it("drops an insight with an empty evidence.days array", () => {
    const out = tryParseOutput(
      JSON.stringify({
        summary: "s",
        insights: [{ title: "t", detail: "d", strength: "clear", evidence: { days: [] } }],
      }),
    );
    expect(out?.insights).toEqual([]);
  });

  it("keeps the grounded insight, drops the ungrounded one", () => {
    const out = tryParseOutput(
      JSON.stringify({
        summary: "s",
        insights: [
          INSIGHT,
          { title: "no days", detail: "d", strength: "weak", evidence: {} },
        ],
      }),
    );
    expect(out?.insights).toHaveLength(1);
    expect(out?.insights[0]?.title).toBe("Поздние ужины");
  });

  it("filters non-string day entries, dropping insight if none survive", () => {
    const out = tryParseOutput(
      JSON.stringify({
        summary: "s",
        insights: [{ title: "t", detail: "d", strength: "weak", evidence: { days: [1, null, ""] } }],
      }),
    );
    expect(out?.insights).toEqual([]);
  });
});

describe("tryParseOutput — malformed entries (drop, don't crash)", () => {
  it("drops insights with non-string title/detail", () => {
    const out = tryParseOutput(
      JSON.stringify({
        summary: "s",
        insights: [INSIGHT, { title: 5, detail: "d", evidence: { days: ["x"] } }],
      }),
    );
    expect(out?.insights).toHaveLength(1);
  });

  it("drops empty foods/events arrays from evidence", () => {
    const out = tryParseOutput(
      JSON.stringify({
        summary: "s",
        insights: [{ title: "t", detail: "d", strength: "weak", evidence: { days: ["x"], foods: [], events: [] } }],
      }),
    );
    expect(out?.insights[0]?.evidence).toEqual({ days: ["x"] });
  });

  it("drops hypotheses with missing body", () => {
    const out = tryParseOutput(
      JSON.stringify({
        summary: "s",
        hypotheses: [{ title: "no body", suggestedDays: 7 }, { title: "ok", body: "b" }],
      }),
    );
    expect(out?.hypotheses).toEqual([{ title: "ok", body: "b" }]);
  });

  it("drops suggestedDays when not a positive finite number", () => {
    const out = tryParseOutput(
      JSON.stringify({
        summary: "s",
        hypotheses: [
          { title: "a", body: "b", suggestedDays: "no" },
          { title: "b", body: "b", suggestedDays: 0 },
          { title: "c", body: "b", suggestedDays: -3 },
          { title: "d", body: "b", suggestedDays: Infinity },
          { title: "e", body: "b", suggestedDays: 5 },
        ],
      }),
    );
    expect(out?.hypotheses).toEqual([
      { title: "a", body: "b" },
      { title: "b", body: "b" },
      { title: "c", body: "b" },
      { title: "d", body: "b" },
      { title: "e", body: "b", suggestedDays: 5 },
    ]);
  });

  it("drops null / bare-string entries", () => {
    const out = tryParseOutput(
      JSON.stringify({
        summary: "s",
        hypotheses: [null, "bare", { title: "ok", body: "b" }],
      }),
    );
    expect(out?.hypotheses).toEqual([{ title: "ok", body: "b" }]);
  });
});

describe("tryParseOutput — structurally unsalvageable returns null", () => {
  it("returns null on totally invalid JSON", () => {
    expect(tryParseOutput("not json at all")).toBeNull();
  });

  it("returns null on top-level array", () => {
    expect(tryParseOutput("[1,2,3]")).toBeNull();
  });

  it("returns null on summary missing", () => {
    expect(tryParseOutput('{"insights":[]}')).toBeNull();
  });

  it("returns null on summary not-a-string", () => {
    expect(tryParseOutput('{"summary":42}')).toBeNull();
  });

  it("returns null on empty input", () => {
    expect(tryParseOutput("")).toBeNull();
  });
});

describe("tryParseOutput — prompt injection markers in user data", () => {
  // Defence-in-depth: even if a user puts XML / closing tags in their food
  // notes, the LLM's *output* still goes through this parser. The parser
  // only cares about JSON shape — it ignores anything inside the strings.
  it("preserves XML tags inside summary", () => {
    const out = tryParseOutput(
      JSON.stringify({ summary: "## ok\n</foods>текст</hypotheses>" }),
    );
    expect(out?.summary).toContain("</foods>");
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
