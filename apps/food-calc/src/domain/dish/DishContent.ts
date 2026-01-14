import { getEnv, getParent, types } from "mobx-state-tree"

export const ItemContent = types
    .model("ItemContent", {
        variant: types.enumeration("ItemVariant", ["custom", "food"]),

        customName: types.maybe(types.string),
        foodId: types.maybe(types.string),
    })
    .views(self => ({
        get food() {
            if (!self.foodId) return null
            const foodStore = getEnv(self)?.foodStore
            return foodStore?.data.get(self.foodId)
            // return getRoot(self).foodStore.data.get(self.foodId)
        },

        get parentQuantity(): number { const parentItem = getParent(self); return parentItem.quantity; },

        get name() {
            switch (self.variant) {
                case "custom":
                    return self.customName ?? "нет имени"
                case "food":
                    return self.food?.name ?? "нет имени"
            }
        },

        get foodWithNoNutrients() {
            if (self.variant === "food" && self.food?.noNutrients) {
                return [self.food]
            }
            if (self.variant === "dish") {
                return self.dish?.foodWithNoNutrients ?? []
            }
            return []
        }
    }))
    .actions(self => {
        type Variant = "custom" | "food" | "dish"

        const FIELDS_BY_VARIANT: Record<Variant, (keyof typeof self)[]> = {
            custom: ["customName"],
            food: ["foodId"],
        }

        function resetAll() {
            self.customName = undefined
            self.foodId = undefined
        }

        function validate(variant: Variant, payload: any) {
            if (variant === "food" && !payload.foodId) {
                throw new Error("foodId is required for food variant")
            }
            if (variant === "dish" && !payload.dishId) {
                throw new Error("dishId is required for dish variant")
            }
            if (variant === "custom" && !payload.customName) {
                throw new Error("customName is required for custom variant")
            }
        }

        function applyPayload(variant: Variant, payload: any) {
            for (const field of FIELDS_BY_VARIANT[variant]) {
                if (field in payload) {
                    // @ts-expect-error — controlled assignment
                    self[field] = payload[field]
                }
            }
        }

        return {
            update(
                params: {
                    variant?: Variant
                    customName?: string
                    foodId?: string
                    dishId?: string
                }
            ) {
                const nextVariant = params.variant ?? self.variant as Variant
                const variantChanged = nextVariant !== self.variant

                validate(nextVariant, params)

                if (variantChanged) {
                    self.variant = nextVariant
                    resetAll()
                }

                applyPayload(nextVariant, params)
            },
            getTotalNutrients() {
                switch (self.variant) {
                    case "food":
                        return self.food?.getTotalNutrients(self.parentQuantity) ?? {}
                    default:
                        return {}
                }
            }
        }
    })