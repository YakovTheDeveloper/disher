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

  it("throws when both foodId and dishId are provided", () => {
    expect(() =>
      addScheduleFood(store, {
        date: "01-01-2025",
        time: "12:00",
        type: "food",
        quantity: 100,
        foodId: "food-1",
        dishId: "dish-1",
      }),
    ).toThrow("cannot set both foodId and dishId");
  });

  it("throws when neither foodId nor dishId is provided", () => {
    expect(() =>
      addScheduleFood(store, {
        date: "01-01-2025",
        time: "12:00",
        type: "food",
        quantity: 100,
      }),
    ).toThrow("must set either foodId or dishId");
  });

  it("throws when both are explicitly null", () => {
    expect(() =>
      addScheduleFood(store, {
        date: "01-01-2025",
        time: "12:00",
        type: "food",
        quantity: 100,
        foodId: null,
        dishId: null,
      }),
    ).toThrow("must set either foodId or dishId");
  });

  it("passes validation with only foodId", () => {
    const id = addScheduleFood(store, {
      date: "01-01-2025",
      time: "12:00",
      type: "food",
      quantity: 100,
      foodId: "food-1",
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

  it("throws when both foodId and dishId are non-null", () => {
    expect(() =>
      updateScheduleFood(store, "item-1", {
        foodId: "food-1",
        dishId: "dish-1",
      }),
    ).toThrow("cannot set both foodId and dishId");
  });

  it("throws when both foodId and dishId are explicitly null", () => {
    expect(() =>
      updateScheduleFood(store, "item-1", {
        foodId: null,
        dishId: null,
      }),
    ).toThrow("must set either foodId or dishId");
  });

  it("passes when updating only foodId", () => {
    updateScheduleFood(store, "item-1", { foodId: "food-2" });
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it("passes when updating only time", () => {
    updateScheduleFood(store, "item-1", { time: "14:00" });
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });
});
