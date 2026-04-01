import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Store } from "@livestore/livestore";

vi.mock("@/shared/lib/user", () => ({
  getCurrentUserId: vi.fn(() => "test-user"),
}));

const mockCommit = vi.fn();
const store = { commit: mockCommit } as unknown as Store;

const { addScheduleFood, updateScheduleFood } = await import("./mutations");

describe("addScheduleFood validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when both productId and dishId are provided", () => {
    expect(() =>
      addScheduleFood(store, {
        date: "01-01-2025",
        time: "12:00",
        type: "food",
        quantity: 100,
        productId: "food-1",
        dishId: "dish-1",
      }),
    ).toThrow("cannot set both productId and dishId");
  });

  it("throws when neither productId nor dishId is provided", () => {
    expect(() =>
      addScheduleFood(store, {
        date: "01-01-2025",
        time: "12:00",
        type: "food",
        quantity: 100,
      }),
    ).toThrow("must set either productId or dishId");
  });

  it("throws when both are explicitly null", () => {
    expect(() =>
      addScheduleFood(store, {
        date: "01-01-2025",
        time: "12:00",
        type: "food",
        quantity: 100,
        productId: null,
        dishId: null,
      }),
    ).toThrow("must set either productId or dishId");
  });

  it("passes validation with only productId", () => {
    const id = addScheduleFood(store, {
      date: "01-01-2025",
      time: "12:00",
      type: "food",
      quantity: 100,
      productId: "food-1",
    });
    expect(id).toBeDefined();
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it("passes validation with only dishId", () => {
    const id = addScheduleFood(store, {
      date: "01-01-2025",
      time: "12:00",
      type: "dish",
      quantity: 100,
      dishId: "dish-1",
    });
    expect(id).toBeDefined();
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });
});

describe("updateScheduleFood validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when both productId and dishId are non-null", () => {
    expect(() =>
      updateScheduleFood(store, "item-1", {
        productId: "food-1",
        dishId: "dish-1",
      }),
    ).toThrow("cannot set both productId and dishId");
  });

  it("throws when both productId and dishId are explicitly null", () => {
    expect(() =>
      updateScheduleFood(store, "item-1", {
        productId: null,
        dishId: null,
      }),
    ).toThrow("must set either productId or dishId");
  });

  it("passes when updating only productId", () => {
    updateScheduleFood(store, "item-1", { productId: "food-2" });
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it("passes when updating only time", () => {
    updateScheduleFood(store, "item-1", { time: "14:00" });
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });
});
