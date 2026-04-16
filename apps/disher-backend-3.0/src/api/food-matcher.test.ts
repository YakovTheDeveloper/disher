import { describe, it, beforeAll, expect } from "vitest";
import { initMatcher, matchOne, normalizeForEmbedding } from "./food-matcher.js";

beforeAll(async () => {
  await initMatcher();
}, 120_000);

describe("normalizeForEmbedding", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizeForEmbedding('Овсянка, с "бананом"!')).toBe("овсянка с бананом");
  });
  it("collapses whitespace", () => {
    expect(normalizeForEmbedding("  гречка   варёная  ")).toBe("гречка варёная");
  });
});

// Each case: query + a substring that the top-1 match's name MUST contain.
// Substring is lowercase; comparison is case-insensitive.
const cases: Array<{ query: string; expectSubstring: string }> = [
  { query: "овсянка", expectSubstring: "овсян" },
  { query: "банан", expectSubstring: "банан" },
  { query: "картошка", expectSubstring: "картоф" },
  { query: "яйцо", expectSubstring: "яйц" },
  { query: "хлеб белый", expectSubstring: "хлеб" },
  { query: "молоко", expectSubstring: "молок" },
  { query: "куриная грудка", expectSubstring: "кур" },
  { query: "кофе", expectSubstring: "кофе" },
  { query: "гречка", expectSubstring: "греч" },
  { query: "рис варёный", expectSubstring: "рис" },
  { query: "творог", expectSubstring: "творог" },
  { query: "сыр", expectSubstring: "сыр" },
  { query: "масло сливочное", expectSubstring: "масло" },
  { query: "помидор", expectSubstring: "помидор" },
  { query: "огурец", expectSubstring: "огур" },
  { query: "морковь", expectSubstring: "морков" },
  { query: "яблоко", expectSubstring: "яблок" },
  { query: "говядина", expectSubstring: "говяди" },
  { query: "сметана", expectSubstring: "сметан" },
  { query: "макароны", expectSubstring: "макарон" },
];

describe("topKMatches: Russian queries → top-1 sanity", () => {
  const results: Array<{ query: string; top1: string; score: number; pass: boolean }> = [];

  it.each(cases)("top-1 for '$query' contains '$expectSubstring'", async ({ query, expectSubstring }) => {
    const matches = await matchOne(query, 3);
    const top = matches[0];
    const pass = top.name.toLowerCase().includes(expectSubstring.toLowerCase());
    results.push({ query, top1: top.name, score: top.score, pass });
    expect(top.name.toLowerCase()).toContain(expectSubstring.toLowerCase());
  });

  it("logs score distribution", () => {
    console.log("\n=== Top-1 scores ===");
    for (const r of results) {
      console.log(`  ${r.pass ? "✓" : "✗"} ${r.query.padEnd(22)} → ${r.top1.padEnd(40)} (${r.score.toFixed(3)})`);
    }
    const passed = results.filter((r) => r.pass).length;
    console.log(`\n${passed}/${results.length} passed`);
  });
});
