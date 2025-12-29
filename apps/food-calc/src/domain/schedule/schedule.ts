import { getEnv, getRoot, getSnapshot, Instance, onPatch, types } from "mobx-state-tree";
import { getParent } from "mobx-state-tree";

import { Dish } from "../dish/Dish";
import { ItemStatusType, SyncStatus } from "@/domain/commonListItem";
import { sumRecordArray } from "@/lib/sumRecords/sumRecords";
import { emitter } from "@/infrastructure/emitter/emitter";
import { ChildrenController } from "@/domain/shared/ChildrenController";
import { groupItemsByTime } from "@/domain/schedule/schedule.service";

export type ScheduleItemType = Instance<typeof ScheduleItem>["type"];

export type AllScheduleItemContentTypes = Instance<typeof DishItemContent> | Instance<typeof FoodItemContent> | Instance<typeof CustomItemContent>

type ChildVariant = "dish" | "food" | "custom";

export const ItemContent = types
    .model("ItemContent", {
        variant: types.enumeration("ItemVariant", ["custom", "food", "dish"]),

        customName: types.maybe(types.string),

        foodId: types.maybe(types.string),
        dishId: types.maybe(types.string),
    })
    .views(self => ({
        get food() {
            if (!self.foodId) return null
            const foodStore = getEnv(self)?.foodStore
            return foodStore?.data.get(self.foodId)
            // return getRoot(self).foodStore.data.get(self.foodId)
        },

        get dish(): Instance<typeof Dish> | undefined {
            if (!self.dishId) return undefined
            return getRoot(self).dishStore.data.get(self.dishId)
        },
        get parentQuantity(): number { const parentItem = getParent(self); return parentItem.quantity; },

        get name() {
            switch (self.variant) {
                case "custom":
                    return self.customName ?? "нет имени"
                case "food":
                    return self.food?.name ?? "нет имени"
                case "dish":
                    return self.dish?.name ?? "нет имени"
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
            dish: ["dishId"],
        }

        function resetAll() {
            self.customName = undefined
            self.foodId = undefined
            self.dishId = undefined
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
                    case "dish":
                        return self.dish?.getTotalNutrients(self.parentQuantity) ?? {}
                    default:
                        return {}
                }
            }
        }
    })

export const ScheduleItem = types.model("ScheduleItem", {
    id: types.identifier,
    quantity: types.number,
    time: types.string,
    sync: types.optional(SyncStatus, {}),
    content: types.optional(ItemContent, { variant: 'custom' }),

}).views(self => ({
    get type() {
        return self.content.variant
    }
}))
    .actions(self => {
        function updateTime(time: string) {
            self.time = time;
        }
        function updateQuantity(quantity: number) {
            self.quantity = quantity;
        }
        function updateChildContent(variant: ChildVariant, payload: {
            customName?: string
            foodId?: string
            dishId?: string
        }) {
            self.content.update({ variant, ...payload })
        }
        function updateCustom(state: { customName: string }) {
            const customName = state.customName.toString();
            updateChildContent('custom', { customName });
        }

        function updateFood(state: { foodId: string }) {
            updateChildContent('food', { foodId: state.foodId });
        }

        function updateDish(state: { dishId: string }) {
            updateChildContent('dish', { dishId: state.id.toString() });
        }

        return {
            updateTime,
            updateQuantity,
            updateCustom,
            updateFood,
            updateDish
        }
    });

export const EventItem = types.model("EventItem", {
    id: types.identifier,
    value: types.string,
    time: types.string,
    sync: types.optional(SyncStatus, {}),
    type: types.string

}).views(self => ({

}))
    .actions(self => ({
        updateTime(time: string) {
            self.time = time;
        }
    }));

const DayScheduleDraftModel = types.model({
    event: types.optional(EventItem, () => ({
        id: 'draft-event',
        time: '12:00',
        value: '',
        type: 'custom'
    })),
    food: types.optional(ScheduleItem, () => ({
        id: 'draft-food',
        quantity: 100,
        time: '12:00',
        content: { variant: 'custom', customName: 'Мой продукт' }
    }))
}).actions(self => ({
    resetDraftFood() {
        self.food.updateChildContent("custom", { customName: 'Мой продукт' })
        self.food.updateTime('12:00')
        self.food.updateQuantity(100)
    }
}
))

export const DaySchedule = types.model({
    id: types.identifier,
    userId: types.number,
    lastSync: types.optional(types.string, ""),
    lastTimeItemAdded: types.optional(types.string, ""),
    lastTimeEventAdded: types.optional(types.string, ""),
    foods: ChildrenController(ScheduleItem),
    events: ChildrenController(EventItem),
    draft: types.optional(DayScheduleDraftModel, () => ({})),
})
    .views(self => ({
        getChildById(id: string) {
            return self.foods.items.find(i => i.id.toString() === id) || null;
        },
        get customItems() {
            return self.foods.items.filter(i => i.content.variant === 'custom') || null;
        },
        get allDraftDishesFromItems() {
            return self.foods.items
                .filter(item => item.content.variant === "dish" && item.content.dish && !item.content.dish.lastSync)
                .map(item => item.content.dish!)

        },
        get foodWithNoNutrients() {
            return Array.from(new Set(self.foods.items
                .flatMap(item => item.content.foodWithNoNutrients)))
        },
        get itemsLength() {
            return self.foods.items.length
        },
        get isNoItems() {
            return self.foods.items.length === 0
        },
        get isNoDailyEventItems() {
            return self.events?.items?.length === 0
        },
        get foodsGroupedByTime() {
            return groupItemsByTime(self.foods.items);
        },

        get eventsGroupedByTime() {
            return groupItemsByTime(self.events.items);
        }
    }))
    .actions(self => {

        let disposer: any = null

        function afterCreate() {
            // локальный слушатель ПАТЧЕЙ
            disposer = onPatch(self, patch => {
                if (
                    patch.path.match(/items\/\d+\/quantity/) ||
                    patch.path.match(/items\/\d+\/content/) ||
                    patch.path === "/items" ||                         // полностью изменён
                    patch.path.match(/items\/\d+$/)                    // add/remove
                ) {
                    emitter.emit('CALCULATION_NEEDED')
                }
            })
        }

        function addDraftToFoods(draft: Instance<typeof ScheduleItem>) {
            const { time, quantity, content } = draft;
            self.foods.addChildWithLocalData({
                time,
                quantity,
                content: getSnapshot(content)
            })
            self.lastTimeItemAdded = time
        }

        function addDraftToEvents(draft: Instance<typeof EventItem>) {
            const { time, value, type } = draft;
            self.events.addChildWithLocalData({
                time,
                value,
                type
            })
            self.lastTimeEventAdded = time
        }

        function beforeDestroy() {
            disposer?.()
        }

        function getTotalNutrients() {
            const nutrients = self.foods.items.map(item =>
                item.content.getTotalNutrients()
            );
            return sumRecordArray(nutrients);
        }

        function changeStatusByIds(ids: string[], status: ItemStatusType = 'deleted') {
            self.foods.items.replace(self.foods.items.map(item => {

                const thatId = ids.includes(String(item.id))
                if (thatId) return {
                    ...item,
                    status
                }
                return item
            }));
        }

        function updateChildContent(id: string, variant: ChildVariant, payload: {
            customName?: string
            foodId?: string
            dishId?: string
        }) {
            const child = self.getChildById(id)
            if (!child) return
            child.updateChildContent(variant, payload)
        }

        function updateTime(id: string, time: string) {
            self.foods.updateChildById({ id, time });
            self.lastTimeItemAdded = time
        }

        function updateEventTime(id: string, time: string) {
            self.events.updateChildById({ id, time });
            // self.lastTimeItemAdded = time
        }

        function updateQuantity(id: string, quantity: number) {
            self.foods.updateChildById({ id, quantity });
        }

        function addOrUpdateEvent(itemId: string | null, state: { type: string, value: string, time: string }) {
            const { type, value, time } = state;
            if (!itemId) {
                self.events.addChildWithLocalData({
                    type,
                    time,
                    value,
                });
                return;
            }
            self.foods.updateChildById({ id: itemId, type, value, time });
        }

        return {
            addDraftToFoods,
            addDraftToEvents,
            updateEventTime,
            addOrUpdateEvent,
            changeStatusByIds,
            updateChildContent,
            updateTime,
            updateQuantity,
            getTotalNutrients,
            afterCreate,
            beforeDestroy
        };
    })
