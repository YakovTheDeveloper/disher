import { describe, expect, it } from "vitest";
import { buildDishUserPrompt } from "../analyze-dish.js";

// Pure helper — covers prompt composition without spinning up Fastify or
// touching OpenRouter. The route handler itself is a thin SSE proxy; its
// integration story is the manual smoke-test against a real LLM.

describe("buildDishUserPrompt", () => {
  it("includes dish name and total grams in the header", () => {
    const out = buildDishUserPrompt("Борщ", 850, [
      { name: "свёкла", grams: 300, details: "" },
    ]);
    expect(out).toContain("Блюдо: Борщ (~850г общий вес)");
  });

  it("omits weight tag when totalGrams is 0", () => {
    const out = buildDishUserPrompt("Салат", 0, [
      { name: "огурец", grams: 100, details: "" },
    ]);
    expect(out).toMatch(/^Блюдо: Салат$/m);
    expect(out).not.toContain("(~0г");
  });

  it("falls back to (без названия) when dish name is empty", () => {
    const out = buildDishUserPrompt("", 500, []);
    expect(out).toContain("Блюдо: (без названия)");
  });

  it("renders ingredient details in square brackets", () => {
    const out = buildDishUserPrompt("Борщ", 0, [
      { name: "свёкла", grams: 300, details: "печёная" },
      { name: "говядина", grams: 200, details: "" },
    ]);
    expect(out).toContain("- свёкла: 300г [печёная]");
    expect(out).toContain("- говядина: 200г");
    expect(out).not.toContain("[]"); // empty details produces no brackets
  });

  it("shows '(нет ингредиентов)' when list is empty", () => {
    const out = buildDishUserPrompt("Хлеб", 100, []);
    expect(out).toContain("(нет ингредиентов)");
  });

  it("drops grams suffix when grams is 0 or missing", () => {
    const out = buildDishUserPrompt("X", 0, [
      { name: "что-то", grams: "abc" as unknown as number, details: "" },
    ]);
    expect(out).toMatch(/- что-то$/m);
    expect(out).not.toContain("- что-то: ");
  });

  it("uses '?' for ingredient with empty name", () => {
    const out = buildDishUserPrompt("Блюдо", 0, [
      { name: "", grams: 50, details: "" },
    ]);
    expect(out).toContain("- ?: 50г");
  });
});
