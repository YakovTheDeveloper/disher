import Dexie, { type Table } from "dexie";

/** KV format: one row per food, nutrients packed as { nutrientId: quantity } */
export interface DexieFoodNutrientKV {
  productId: string;
  nutrients: Record<string, number>;
}

class ReferenceDb extends Dexie {
  foodNutrients!: Table<DexieFoodNutrientKV>;

  constructor() {
    super("disher-reference-v2");
    this.version(1).stores({
      foodNutrients: "productId",
    });
  }
}

export const referenceDb = new ReferenceDb();
