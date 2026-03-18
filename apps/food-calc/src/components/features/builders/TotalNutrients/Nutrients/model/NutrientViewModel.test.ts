// TODO: full rewrite needed — tests relied on MST stores (FoodModelStore, DailyNormModelStore, DailyNormsStoreUI)
// These need to be rewritten once the NutrientViewModelStore is migrated to Triplit.

import { describe, it, expect } from "vitest";

describe("NutrientViewModelStore", () => {
    it.todo("calculates sums correctly");
    it.todo("getValue returns nutrient sum");

    describe('getPercent', () => {
        it.todo("getPercent respects daily norms");
        it.todo("getPercent respects daily norms after daily norm changed");
    })
});
