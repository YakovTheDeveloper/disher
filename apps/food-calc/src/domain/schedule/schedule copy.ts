import { applySnapshot, getRoot, getSnapshot, Instance, types } from "mobx-state-tree";
import { getParent } from "mobx-state-tree";

import { Dish, DishItem } from "../dish/Dish";
import { Food } from "@/domain/Food";
import { ItemStatus, ItemStatusType } from "@/domain/commonListItem";
import { TimeGroupUI } from "@/components/features/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { createDishModel, createDishSnapshot } from "@/store/DishStore/fabric";
import { RootInstance } from "@/store/types";

export type ScheduleItemType = Instance<typeof BaseScheduleItem>["type"];

export type AllScheduleItemContentTypes = Instance<typeof BaseScheduleItem> | Instance<typeof FoodScheduleItem> | Instance<typeof CustomScheduleItem> | Instance<typeof DishScheduleItem>

type ChildVariant = "dish" | "food" | "custom";

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

    })).actions((self) => {

        // function createLocal() {
        //     const item = FoodScheduleItem.create({
        //         title: "",
        //         id: Date.now(),
        //         type: "food",
        //         quantity: 100,
        //         time: "08:00",
        //         scheduleId: self.id,
        //         foodId,
        //         food: foodId,
        //         status: "added",
        //         ...fields,
        //     });
        //     return item
        // }

        return {

        }
    })

export const DishScheduleItem = BaseScheduleItem
    .named("DishScheduleItem")
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
        currentId: types.optional(types.number, -1),
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
    .actions(self => {

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

        function addFoodItemAndSetAsCurrent(
            foodId: string,
            fields: Partial<Instance<typeof FoodScheduleItem>> = {}
        ) {
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
                ...fields,
            });

            self.items.push(item);
            setCurrent(item.id)
            return item;
        }

        function updateChildVariant(
            variant: ChildVariant,
            value: string,
            fields: any = {}
        ) {
            if (!self.current) return;

            if (self.current?.type === variant) {

                if (variant === 'custom') {
                    Object.assign(self.current, {
                        customFoodName: value
                    });
                    return
                }
                if (variant === 'food') {
                    Object.assign(self.current, {
                        foodId: value,
                        food: value
                    });
                    return
                }
                if (variant === 'dish') {
                    Object.assign(self.current, {
                        dishId: value,
                        dish: value
                    });
                    return
                }

            }

            const configs = {
                dish: {
                    model: DishScheduleItem,
                    defaults: {
                        type: "dish",
                        quantity: 100,
                        dishId: value,
                        dish: value,
                    }
                },
                food: {
                    model: FoodScheduleItem,
                    defaults: {
                        type: "food",
                        quantity: 100,
                        foodId: value,
                        food: value,
                    }
                },
                custom: {
                    model: CustomScheduleItem,
                    defaults: {
                        type: "custom",
                        quantity: 1,
                        customFoodName: value,
                    }
                }
            } as const;

            const old = self.current;            // reference the old item
            const oldId = old.id;                // preserve ID
            const oldIndex = self.items.indexOf(old);  // position in list

            const cfg = configs[variant];

            // 1. Create the new model with the old ID
            const newModel = cfg.model.create({
                id: oldId,
                ...cfg.defaults,
                ...fields
            });

            // 2. Replace it in the same position for smooth UI updates
            self.items.splice(oldIndex, 1, newModel);

            // 3. Update self.current to point to the new model
            setCurrent(newModel.id);

            return newModel;

        }

        function updateTime(time: string) {
            updateCurrent({ time });
        }

        function updateQuantity(quantity: number) {
            updateCurrent({ quantity });
        }

        function updateCurrent(
            fields: Partial<Instance<typeof CustomScheduleItem>>
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
            changeStatusByIds,
            updateChildVariant,
            addFoodItemAndSetAsCurrent,
            updateTime,
            updateQuantity,
            updateCurrent,
            deleteItem,
            recoverItem,
        };
    })
