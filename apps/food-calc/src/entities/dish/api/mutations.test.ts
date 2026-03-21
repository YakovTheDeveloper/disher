import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn();
const mockFetch = vi.fn();
const mockQuery = vi.fn(() => ({
  Where: vi.fn(() => "mock-query"),
}));

vi.mock("@/api/triplit/client", () => ({
  triplit: {
    insert: (...args: unknown[]) => mockInsert(...args),
    update: vi.fn(),
    delete: vi.fn(),
    fetch: (...args: unknown[]) => mockFetch(...args),
    query: (...args: unknown[]) => mockQuery(...args),
  },
}));

vi.mock("@/api/triplit/session", () => ({
  getCurrentUserId: vi.fn(() => "test-user"),
}));

const { dishItemsToScheduleFoods } = await import("./mutations");

describe("dishItemsToScheduleFoods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("copies all dish items to schedule when no itemIds filter", async () => {
    const dishItems = new Map([
      ["item-1", { id: "item-1", dishId: "dish-1", foodId: "food-1", quantity: 100 }],
      ["item-2", { id: "item-2", dishId: "dish-1", foodId: "food-2", quantity: 200 }],
    ]);
    mockFetch.mockResolvedValue(dishItems);

    await dishItemsToScheduleFoods("dish-1", "01-01-2025", "12:00");

    expect(mockInsert).toHaveBeenCalledTimes(2);
    expect(mockInsert).toHaveBeenCalledWith(
      "scheduleFoods",
      expect.objectContaining({
        date: "01-01-2025",
        time: "12:00",
        type: "food",
        foodId: "food-1",
        quantity: 100,
        dishId: null,
        userId: "test-user",
      }),
    );
    expect(mockInsert).toHaveBeenCalledWith(
      "scheduleFoods",
      expect.objectContaining({
        foodId: "food-2",
        quantity: 200,
      }),
    );
  });

  it("copies only specified items when itemIds provided", async () => {
    const dishItems = new Map([
      ["item-1", { id: "item-1", dishId: "dish-1", foodId: "food-1", quantity: 100 }],
      ["item-2", { id: "item-2", dishId: "dish-1", foodId: "food-2", quantity: 200 }],
    ]);
    mockFetch.mockResolvedValue(dishItems);

    await dishItemsToScheduleFoods("dish-1", "01-01-2025", "12:00", ["item-2"]);

    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledWith(
      "scheduleFoods",
      expect.objectContaining({
        foodId: "food-2",
        quantity: 200,
      }),
    );
  });

  it("does nothing when dish has no items", async () => {
    mockFetch.mockResolvedValue(new Map());

    await dishItemsToScheduleFoods("dish-1", "01-01-2025", "12:00");

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("sets dishId to null on created schedule foods", async () => {
    const dishItems = new Map([
      ["item-1", { id: "item-1", dishId: "dish-1", foodId: "food-1", quantity: 50 }],
    ]);
    mockFetch.mockResolvedValue(dishItems);

    await dishItemsToScheduleFoods("dish-1", "02-02-2025", "08:00");

    expect(mockInsert).toHaveBeenCalledWith(
      "scheduleFoods",
      expect.objectContaining({ dishId: null }),
    );
  });
});
