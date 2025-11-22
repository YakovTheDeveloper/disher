import { getRoot, Instance, types } from "mobx-state-tree";
import { getParent } from "mobx-state-tree";

import { Dish } from "./Dish";
import { Food } from "@/domain/food";
import { ItemStatus } from "@/domain/commonListItem";
import { TimeGroupUI } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";

export type ScheduleItemType = Instance<typeof BaseScheduleItem>["type"];

const BaseScheduleItem = types.model("BaseScheduleItem", {
    type: types.enumeration("ScheduleItemType", ["dish", "food", "custom"]),
    id: types.identifierNumber,
    quantity: types.number,
    time: types.string,
    title: types.string,
    scheduleId: types.number,
    status: types.optional(ItemStatus, "none")
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

export const FoodScheduleItem = BaseScheduleItem
    .named("FoodScheduleItem")
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
        get isFood() { return true; },
        get isDish() { return false; },
        get isCustom() { return false; },
        get name() { return self.food?.name }

    }));

export const DishScheduleItem = BaseScheduleItem
    .named("DishScheduleItem")
    .props({
        type: types.literal("dish"),
        dishId: types.string,
        dish: types.reference(Dish),
    })
    .views((self) => ({
        get isFood() { return false; },
        get isDish() { return true; },
        get isCustom() { return false; },
        get name() { return self.dish.name }

    }));

export const CustomScheduleItem = BaseScheduleItem
    .named("CustomScheduleItem")
    .props({
        type: types.literal("custom"),
        customFoodName: types.string, // required for custom
    })
    .views((self) => ({
        get isFood() { return false; },
        get isDish() { return false; },
        get isCustom() { return true; },
        get name() { return self.customFoodName }
    }));

export const ScheduleItem = types.union(
    FoodScheduleItem,
    DishScheduleItem,
    CustomScheduleItem
);

export const DaySchedule = types
    .model("DaySchedule", {
        id: types.number,
        date: types.identifier,
        userId: types.number,
        dailyEvents: types.maybeNull(types.string),

        items: types.array(ScheduleItem),
        isDraft: types.boolean,
        currentId: types.optional(types.number, -1)
    })
    .views(self => ({
        get current() {
            return self.items.find(i => i.id === self.currentId) || null;
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
    .actions(self => ({
        setCurrent(id: number) {
            self.currentId = id;
        },

        clearCurrent() {
            self.currentId = -1;
        },

        /**
         * Factory: Food item
         */

        /**
 * Factory: Food item
 */
        addOrUpdateFoodItem(foodId: string, fields: Partial<typeof FoodScheduleItem> = {}) {
            if (self.currentMode === 'ADD') {
                const item = FoodScheduleItem.create({
                    title: "",
                    id: Date.now(),
                    type: "food",
                    quantity: 100,
                    time: "08:00",
                    scheduleId: self.id,
                    foodId,
                    food: foodId,
                    status: "added",
                    ...fields
                });
                self.items.push(item);
                return item;
            } else if (self.currentMode === 'UPDATE' && self.current) {
                Object.assign(self.current, { foodId, food: foodId, ...fields });
                self.current.markModified();
                return self.current;
            }
        },

        /**
         * Factory: Dish item
         */
        addOrUpdateDishItem(dishId: string, fields: Partial<typeof DishScheduleItem> = {}) {
            if (self.currentMode === 'ADD') {
                const item = DishScheduleItem.create({
                    title: "",
                    id: Date.now(),
                    type: "dish",
                    quantity: 1,
                    time: "08:00",
                    scheduleId: self.id,
                    dishId,
                    dish: dishId,
                    status: "added",
                    ...fields
                });
                self.items.push(item);
                return item;
            } else if (self.currentMode === 'UPDATE' && self.current) {
                Object.assign(self.current, { dishId, dish: dishId, ...fields });
                self.current.markModified();
                return self.current;
            }
        },

        /**
         * Factory: Custom item
         */
        addOrUpdateCustomItem(name: string, fields: Partial<typeof CustomScheduleItem> = {}) {
            if (self.currentMode === 'ADD') {
                const item = CustomScheduleItem.create({
                    title: "",
                    id: Date.now(),
                    type: "custom",
                    quantity: 1,
                    time: "08:00",
                    scheduleId: self.id,
                    customFoodName: name,
                    status: "added",
                    ...fields
                });
                self.items.push(item);
                return item;
            } else if (self.currentMode === 'UPDATE' && self.current) {
                Object.assign(self.current, { customFoodName: name, ...fields });
                self.current.markModified();
                return self.current;
            }
        },

        addFoodItem(foodId: string) {
            const item = FoodScheduleItem.create({
                title: "",
                id: Date.now(),
                type: "food",
                quantity: 100,
                time: "08:00",
                scheduleId: self.id,
                foodId,
                food: foodId,
                status: "added"
            });
            self.items.push(item);
            return item;
        },

        /**
         * Factory: Dish item
         */
        addDishItem(dishId: string, dishRef: any) {
            const item = DishScheduleItem.create({
                title: "",
                id: Date.now(),
                type: "dish",
                quantity: 1,
                time: "08:00",
                scheduleId: self.id,
                dishId,
                dish: dishRef,
                status: "added"
            });
            self.items.push(item);
            return item;
        },

        /**
         * Factory: Custom item
         */
        addCustomItem(name: string) {
            const item = CustomScheduleItem.create({
                title: "",
                id: Date.now(),
                type: "custom",
                quantity: 1,
                time: "08:00",
                scheduleId: self.id,
                customFoodName: name,
                status: "added"
            });
            self.items.push(item);
            return item;
        },

        updateTime(time: string) {
            self.updateCurrent({ time })
        },

        updateQuantity(quantity: number) {
            self.updateCurrent({ quantity })
        },

        updateCurrent(fields: Partial<typeof CustomScheduleItem>) {
            const item = self.current;
            if (!item) return;

            Object.assign(item, fields);
            item.markModified();
        },

        deleteItem(childId: number) {
            const item = self.items.find(i => i.id === childId);
            if (!item) return;

            if (item.status === "added") {
                // completely remove if it's never been saved
                self.items.replace(self.items.filter(i => i.id !== childId));
                return;
            }

            // soft delete
            item.markDeleted();
        },

        recoverItem(childId: number) {
            const item = self.items.find(i => i.id === childId);
            if (!item) return;
            item.recover();
        }
    }));
