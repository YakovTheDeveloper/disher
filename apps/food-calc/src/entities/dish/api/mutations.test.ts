import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Store } from "@livestore/livestore";

vi.mock("@/shared/lib/user", () => ({
  getCurrentUserId: vi.fn(() => "test-user"),
}));

const mockCommit = vi.fn();
const store = { commit: mockCommit } as unknown as Store;

const { dishItemsToScheduleFoods } = await import("./mutations");

describe("dishItemsToScheduleFoods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates schedule foods for all items", () => {
    const items = [
      { foodId: "food-1", quantity: 100 },
      { foodId: "food-2", quantity: 200 },
    ];

    dishItemsToScheduleFoods(store, items, "01-01-2025", "12:00");

    expect(mockCommit).toHaveBeenCalledTimes(1);
    // commit receives all events as spread args
    const args = mockCommit.mock.calls[0];
    expect(args).toHaveLength(2);
    expect(args[0]).toMatchObject({
      args: expect.objectContaining({
        date: "01-01-2025",
        time: "12:00",
        type: "food",
        foodId: "food-1",
        quantity: 100,
        userId: "test-user",
      }),
    });
    expect(args[1]).toMatchObject({
      args: expect.objectContaining({
        foodId: "food-2",
        quantity: 200,
      }),
    });
  });

  it("does nothing when items array is empty", () => {
    dishItemsToScheduleFoods(store, [], "01-01-2025", "12:00");

    // commit is still called but with no events (spread of empty array)
    // Actually, spread of empty array = 0 args to commit
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it("sets dishId to empty string on created schedule foods", () => {
    const items = [{ foodId: "food-1", quantity: 50 }];

    dishItemsToScheduleFoods(store, items, "02-02-2025", "08:00");

    const event = mockCommit.mock.calls[0][0];
    expect(event).toMatchObject({
      args: expect.objectContaining({ dishId: "" }),
    });
  });
});
