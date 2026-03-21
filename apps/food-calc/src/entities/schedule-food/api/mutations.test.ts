import { describe, it, expect, vi } from "vitest";

vi.mock("@/api/triplit/client", () => ({
  triplit: {
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/api/triplit/session", () => ({
  getCurrentUserId: vi.fn(() => "test-user"),
}));

// Import after mocks
const { addScheduleFood, updateScheduleFood } = await import("./mutations");

describe("addScheduleFood validation", () => {
  it("throws when both foodId and dishId are provided", async () => {
    await expect(
      addScheduleFood({
        date: "01-01-2025",
        time: "12:00",
        type: "food",
        quantity: 100,
        foodId: "food-1",
        dishId: "dish-1",
      }),
    ).rejects.toThrow("cannot set both foodId and dishId");
  });

  it("throws when neither foodId nor dishId is provided", async () => {
    await expect(
      addScheduleFood({
        date: "01-01-2025",
        time: "12:00",
        type: "food",
        quantity: 100,
      }),
    ).rejects.toThrow("must set either foodId or dishId");
  });

  it("throws when both are explicitly null", async () => {
    await expect(
      addScheduleFood({
        date: "01-01-2025",
        time: "12:00",
        type: "food",
        quantity: 100,
        foodId: null,
        dishId: null,
      }),
    ).rejects.toThrow("must set either foodId or dishId");
  });

  it("passes validation with only foodId", async () => {
    await expect(
      addScheduleFood({
        date: "01-01-2025",
        time: "12:00",
        type: "food",
        quantity: 100,
        foodId: "food-1",
      }),
    ).resolves.toBeDefined();
  });

  it("passes validation with only dishId", async () => {
    await expect(
      addScheduleFood({
        date: "01-01-2025",
        time: "12:00",
        type: "dish",
        quantity: 100,
        dishId: "dish-1",
      }),
    ).resolves.toBeDefined();
  });
});

describe("updateScheduleFood validation", () => {
  it("throws when both foodId and dishId are non-null", async () => {
    await expect(
      updateScheduleFood("item-1", {
        foodId: "food-1",
        dishId: "dish-1",
      }),
    ).rejects.toThrow("cannot set both foodId and dishId");
  });

  it("throws when both foodId and dishId are explicitly null", async () => {
    await expect(
      updateScheduleFood("item-1", {
        foodId: null,
        dishId: null,
      }),
    ).rejects.toThrow("must set either foodId or dishId");
  });

  it("passes when updating only foodId", async () => {
    await expect(
      updateScheduleFood("item-1", { foodId: "food-2" }),
    ).resolves.toBeUndefined();
  });

  it("passes when updating only time", async () => {
    await expect(
      updateScheduleFood("item-1", { time: "14:00" }),
    ).resolves.toBeUndefined();
  });
});
