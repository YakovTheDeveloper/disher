import { applySnapshot, getRoot, getSnapshot, Instance, types } from "mobx-state-tree";
import { getParent } from "mobx-state-tree";

import { Dish, DishItem } from "../dish/Dish";
import { Food } from "@/domain/Food";
import { ItemStatus, ItemStatusType } from "@/domain/commonListItem";
import { TimeGroupUI } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { createDishModel, createDishSnapshot } from "@/store/DishStore/fabric";
import { RootInstance } from "@/store/types";
import { FoodWithQuantity } from "@/domain/schedule/types";
import { sumRecordArray } from "@/lib/sumRecords/sumRecords";

export type ScheduleItemType = Instance<typeof ScheduleItem>["type"];

export type AllScheduleItemContentTypes = Instance<typeof DishItemContent> | Instance<typeof FoodItemContent> | Instance<typeof CustomItemContent>

type ChildVariant = "dish" | "food" | "custom";

// пусть будет у Dish тоже
export const DishItemContent = types.model()
    .named("DishItemContent")
    .props({
        type: types.literal("dish"),
        dishId: types.string,
        dish: types.reference(Dish, {
            get(identifier, parent) {
                const root = getRoot(parent); // <-- MST helper to get the tree root
                return root.dishStore.data.get(identifier);
            },
            set(value) {
                return value.id; // MST needs to know how to store reference
            }
        }),
    })
    .views((self) => ({
        get name() { return self.dish?.name || 'нет имени' },
        get parentQuantity(): number {
            const parentItem = getParent(self);
            return parentItem.quantity;
        },
        get foodWithNoNutrients() {
            return self.dish.foodWithNoNutrients
        }

    })).actions(self => {

        function getTotalNutrients() {
            return self.dish.getTotalNutrients(self.parentQuantity)
        }

        return {
            getTotalNutrients,
        }
    })

export const CustomItemContent = types.model()
    .named("CustomItemContent")
    .props({
        type: types.literal("custom"),
        name: types.string, // required for custom
    })
    .views((self) => ({
        get isCustom() { return true; },
        get foodWithNoNutrients() {
            return []
        }
    })).actions(self => {

        function getTotalNutrients(): Record<string, number> {
            return {}
        }

        return {
            getTotalNutrients
        }
    })

export const FoodItemContent = types.model()
    .named("FoodItemContent")
    .props({
        type: types.literal("food"),
        foodId: types.string,
        food: types.reference(Food, {
            get(identifier, parent) {
                const root = getRoot(parent); // <-- MST helper to get the tree root
                return root.foodStore.data.get(identifier);
            },
            set(value) {
                return value.id; // MST needs to know how to store reference
            }
        }),
    })
    .views((self) => ({
        get name() { return self.food?.name || 'нет имени' },
        get parentQuantity(): number {
            const parentItem = getParent(self);
            return parentItem.quantity;
        },
        get foodWithNoNutrients() {
            return self.food.noNutrients ? [self.food] : []
        }

    })).actions(self => {

        function getTotalNutrients() {
            return self.food.getTotalNutrients(self.parentQuantity)
        }

        return {
            getTotalNutrients
        }
    })

export const ScheduleItem = types.model("ScheduleItem", {
    type: types.enumeration("ScheduleItemType", ["dish", "food", "custom"]),
    id: types.identifierNumber,
    quantity: types.number,
    time: types.string,
    title: types.string,
    scheduleId: types.number,
    status: types.optional(ItemStatus, "none"),
    content: types.union(
        FoodItemContent,
        DishItemContent,
        CustomItemContent
    )

})
    .actions(self => ({
        setAsCurrent() {
            const parent = getParent<Instance<typeof DaySchedule>>(self, 2);
            console.log("parent", parent);
            parent.setCurrent(self.id);
        },
        markModified() {
            if (self.status === "none") {
                self.status = "modified";
            }
        },
        markDeleted() {
            self.status = "deleted";
        },
        recover() {
            if (self.status === "deleted") {
                self.status = "none";
            }
        }
    }));

export const DaySchedule = types
    .model("DaySchedule", {
        id: types.number,
        date: types.identifier,
        userId: types.number,
        dailyEvents: types.maybeNull(types.string),

        items: types.array(ScheduleItem),
        isDraft: types.boolean,
        lastTimeItemAdded: types.optional(types.string, ""),
        currentId: types.optional(types.number, -1),
    })
    .views(self => ({
        get current() {
            return self.items.find(i => i.id === self.currentId) || null;
        },
        get customItems() {
            return self.items.filter(i => i.content.type === 'custom') || null;
        },
        get foodWithNoNutrients() {
            return Array.from(new Set(self.items
                .flatMap(item => item.content.foodWithNoNutrients)))
        },
        get itemsLength() {
            return self.items.length
        },
        get currentMode() {
            return self.currentId === -1 ? 'ADD' : 'UPDATE'
        },
        get isNoItems() {
            return self.items.length === 0
        },
        get isNoDailyEventItems() {
            return self.dailyEvents?.content?.items?.length === 0
        },
        get itemsGroupedByTime(): TimeGroupUI<Instance<typeof ScheduleItem>>[] {
            const sorted = self.items.slice().sort((a, b) =>
                a.time.localeCompare(b.time) // HH:mm safe
            );

            const toMinutes = (t: string) => {
                const [hours, minutes] = t.split(":").map(Number);
                return hours * 60 + minutes;
            };

            const groups: {
                time: string;
                items: typeof self.items[0][];
                offset: { hours: number; minutes: number } | null;
            }[] = [];

            let prevTimeMinutes: number | null = null;

            for (const item of sorted) {
                const currentMinutes = toMinutes(item.time);
                let group = groups[groups.length - 1];

                // New group if the time changed
                if (!group || group.time !== item.time) {
                    const diff =
                        prevTimeMinutes == null
                            ? null
                            : currentMinutes - prevTimeMinutes;

                    group = {
                        time: item.time,
                        items: [],
                        offset:
                            diff === null
                                ? null
                                : {
                                    hours: Math.floor(diff / 60),
                                    minutes: diff % 60,
                                },
                    };

                    groups.push(group);
                    prevTimeMinutes = currentMinutes;
                }

                group.items.push(item);
            }

            return groups;
        }
    }))
    .actions(self => {

        function getTotalNutrients() {
            const nutrients = self.items.map(item =>
                item.content.getTotalNutrients()
            );
            return sumRecordArray(nutrients);
        }

        function setCurrent(id: number) {
            self.currentId = id;
        }

        function clearCurrent() {
            self.currentId = -1;
        }

        function changeStatusByIds(ids: string[], status: ItemStatusType = 'deleted') {
            self.items.replace(self.items.map(item => {

                const thatId = ids.includes(String(item.id))
                if (thatId) return {
                    ...item,
                    status
                }
                return item
            }));
        }

        function addDishItem(
            dishId: string,
            fields: Partial<Instance<typeof ScheduleItem>> = {}
        ) {
            const item = ScheduleItem.create({
                title: "",
                id: Date.now(),
                type: "food",
                quantity: 100,
                time: self.lastTimeItemAdded || "08:00",
                scheduleId: self.id,
                status: "added",
                ...fields,
                content: DishItemContent.create({
                    type: 'dish',
                    dishId,
                    dish: dishId,
                })
            });

            self.items.push(item);
            return item;
        }

        function addFoodItem(
            foodId: string,
            fields: Partial<Instance<typeof ScheduleItem>> = {}
        ) {
            const item = ScheduleItem.create({
                title: "",
                id: Date.now(),
                type: "food",
                quantity: 100,
                time: self.lastTimeItemAdded || "08:00",
                scheduleId: self.id,
                status: "added",
                ...fields,
                content: FoodItemContent.create({
                    type: 'food',
                    foodId,
                    food: foodId,
                })
            });

            self.items.push(item);
            return item;
        }

        function addFoodItemAndSetAsCurrent(
            foodId: string,
            fields: Partial<Instance<typeof ScheduleItem>> = {}
        ) {
            const item = addFoodItem(foodId, fields)
            setCurrent(item.id)
            return item;
        }

        function updateChildContent(
            variant: ChildVariant,
            value: string,
            fields: any = {}
        ) {
            if (!self.current) return;

            const config = {
                dish: {
                    model: DishItemContent,
                    payload: {
                        type: 'dish',
                        dish: value,
                        dishId: value
                    }
                },
                food: {
                    model: FoodItemContent,
                    payload: {
                        type: 'food',
                        food: value,
                        foodId: value
                    }
                },
                custom: {
                    model: CustomItemContent,
                    payload: {
                        type: 'custom',
                        name: value
                    }
                }
            } as const

            const payload = config[variant].payload
            const contentModel = config[variant].model

            if (self.current.content?.type === variant) {
                Object.assign(self.current.content, { ...payload })
                return
            }

            const content = contentModel.create(payload)
            self.current.content = content

        }

        function updateTime(time: string) {
            updateCurrent({ time });
            self.lastTimeItemAdded = time
        }

        function updateQuantity(quantity: number) {
            updateCurrent({ quantity });
        }

        function updateCurrent(
            fields: Partial<Instance<typeof ScheduleItem>>
        ) {
            const item = self.current;
            if (!item) return;

            Object.assign(item, fields);
            item.markModified();
        }

        function deleteItemLocal(childId: number) {
            const index = self.items.findIndex(i => i.id === childId);
            if (index === -1) return;

            self.items.splice(index, 1);   // ← Deletes the MST node cleanly
        }

        function deleteItem(childId: number) {
            const item = self.items.find(i => i.id === childId);
            if (!item) return;

            if (item.status === "added") {
                self.items.replace(self.items.filter(i => i.id !== childId));
                return;
            }

            item.markDeleted();
        }

        function recoverItem(childId: number) {
            const item = self.items.find(i => i.id === childId);
            if (!item) return;
            item.recover();
        }

        return {
            setCurrent,
            clearCurrent,
            addDishItem,
            changeStatusByIds,
            updateChildContent,
            addFoodItemAndSetAsCurrent,
            updateTime,
            updateQuantity,
            updateCurrent,
            deleteItem,
            recoverItem,
            getTotalNutrients
        };
    })
