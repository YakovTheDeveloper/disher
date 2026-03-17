import { types } from "mobx-state-tree";

/**
 * CostModel — стоимость продукта/блюда.
 * price — цена за `perGrams` грамм.
 * perGrams — количество грамм, за которое указана цена (по умолчанию 100).
 */
export function CostController() {
    return types.model("CostController", {
        price: types.optional(types.number, 0),
        perGrams: types.optional(types.number, 100),
    }).views(self => ({
        get hasCost() {
            return self.price > 0;
        },
        get pricePerGram() {
            if (self.perGrams <= 0) return 0;
            return self.price / self.perGrams;
        },
        get pricePer100g() {
            if (self.perGrams <= 0) return 0;
            return (self.price / self.perGrams) * 100;
        },
        get pricePerKg() {
            if (self.perGrams <= 0) return 0;
            return (self.price / self.perGrams) * 1000;
        },
        costForWeight(grams: number) {
            if (self.perGrams <= 0) return 0;
            return (self.price / self.perGrams) * grams;
        },
    })).actions(self => ({
        setCost(price: number, perGrams: number = 100) {
            self.price = price;
            self.perGrams = perGrams;
        },
        clearCost() {
            self.price = 0;
            self.perGrams = 100;
        },
    }));
}
