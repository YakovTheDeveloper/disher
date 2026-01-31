import { clone, getEnv, getRoot, getSnapshot, Instance, onPatch, types } from "mobx-state-tree";
import { SyncStatus } from "@/domain/commonListItem";
import { sumRecordArray } from "@/lib/sumRecords/sumRecords";
import { emitter } from "@/infrastructure/emitter/emitter";
import { ChildrenController } from "@/domain/shared/ChildrenController";
import { groupItemsByTime } from "@/domain/schedule/schedule.service";
import { EventItem } from "@/domain/schedule/scheduleEvent/scheduleEvent";
import { DishStore } from "@/store/DishStore/DishStore";
import { FoodContentDish, FoodContentProduct, FoodContentType } from "@/domain/shared/foodContent/foodContent";
import { ScheduleFactory } from "@/domain/schedule/factory";
import { generateId } from "@/lib/id/generateId";

export interface RootStoreEnv {
    dishStore: Instance<typeof DishStore>;
}

export type ScheduleItemType = Instance<typeof ScheduleItem>["type"];

const ScheduleItemContent = types.union(
    {
        dispatcher(snapshot) {
            if (snapshot == null) {
                return FoodContentProduct
            }

            return snapshot.variant === "dish"
                ? FoodContentDish
                : FoodContentProduct
        },
    },
    FoodContentProduct,
    FoodContentDish
)

export const ScheduleItem = types.model("ScheduleItem", {
    id: types.identifier,
    quantity: types.number,
    time: types.string,
    sync: types.optional(SyncStatus, {}),
    content: types.maybeNull(ScheduleItemContent)

}).views(self => ({
    get type() {
        return self.content?.variant || ''
    },
}))
    .actions(self => {
        function updateTime(time: string) {
            self.time = time;
        }
        function updateQuantity(quantity: number) {
            self.quantity = quantity;
        }
        function updateContent(inputVariant: FoodContentType, id: string) {

            if (self.content === null) {
                if (inputVariant === 'product') {
                    self.content = ScheduleItemContent.create({
                        variant: 'product',
                        foodId: id
                    })
                } else {
                    self.content = ScheduleItemContent.create({
                        variant: 'dish',
                        dishId: id
                    })
                }
                return
            }

            if (self.content.variant === 'dish' && inputVariant === 'product') {
                self.content = ScheduleItemContent.create({
                    variant: 'product',
                    foodId: id
                })
                return
            }
            if (self.content.variant === 'product' && inputVariant === 'dish') {
                self.content = ScheduleItemContent.create({
                    variant: 'dish',
                    dishId: id
                })
                return
            }
            self.content.update(id)
        }

        return {
            updateTime,
            updateQuantity,
            updateContent
        }
    });

export const Draft = types.model("Draft", {
    eventDraft: types.optional(EventItem, {
        id: "DRAFT",
        time: '12:00',
        type: 'custom',
        value: ''
    }),
    foodDraft: types.optional(ScheduleItem, {
        id: "DRAFT",
        time: '12:00',
        quantity: 100
    })
}).actions(self => ({
    clearEvent() {
        self.eventDraft.time = '12:00'
        self.eventDraft.type = 'custom'
        self.eventDraft.value = ''
    },
    clearFood() {
        self.foodDraft.content = null
        self.foodDraft.quantity = 100
    },
}));

export const DaySchedule = types.model({
    id: types.identifier,
    userId: types.number,
    lastSync: types.optional(types.string, ""),
    lastTimeItemAdded: types.optional(types.string, ""),
    lastTimeEventAdded: types.optional(types.string, ""),
    draft: types.optional(Draft, {}),
    foods: ChildrenController(ScheduleItem),
    events: ChildrenController(EventItem),
})
    .views(self => ({
        getChildById(id: string): Instance<typeof ScheduleItem> | null {
            return self.foods.items.find(item => item.id.toString() === id) || null;
        },
        get customItems() {
            return self.foods.items.filter(item => item.content?.food?.createdByUser) || null;
        },
        get allDraftDishesFromItems() {
            return self.foods.items
                .filter(item => item.content?.variant === "dish" && item.content.dish && !item.content.dish.lastSync)
                .map(item => item.content.dish!)

        },
        get foodWithNoNutrients() {
            return Array.from(new Set(self.foods.items
                .filter(item => item.content != null)
                .flatMap(item => item.content!.foodWithNoNutrients)))
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

        function addDraftToFoods() {
            const instance = self.foods.addChildWithLocalData(getSnapshot(self.draft.foodDraft))
            self.draft.clearFood()
            return instance.id;
        }

        function addDraftToEvents() {
            const instance = self.events.addChildWithLocalData(getSnapshot(self.draft.eventDraft))
            self.draft.clearEvent()
            return instance.id;
        }

        function beforeDestroy() {
            disposer?.()
        }

        function getTotalNutrients() {
            const nutrients = self.foods.items.map(item => {
                if (item.content == null) return {}
                return item.content.getTotalNutrients()
            });
            return sumRecordArray(nutrients);
        }

        // function changeStatusByIds(ids: string[], status: ItemStatusType = 'deleted') {

        //     self.foods.items.replace(self.foods.items.map(item => {

        //         const thatId = ids.includes(String(item.id))
        //         if (thatId) return {
        //             ...item,
        //             status
        //         }
        //         return item
        //     }));
        // }

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
            self.events.updateChildById({ id: itemId, type, value, time });
        }

        return {
            addDraftToFoods,
            addDraftToEvents,
            updateEventTime,
            addOrUpdateEvent,
            // changeStatusByIds,
            updateTime,
            updateQuantity,
            getTotalNutrients,
            afterCreate,
            beforeDestroy
        };
    })
