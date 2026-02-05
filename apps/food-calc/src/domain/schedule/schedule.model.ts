import { getSnapshot, Instance, onPatch, types } from "mobx-state-tree";
import { SyncStatus } from "@/domain/commonListItem";
import { sumRecordArray } from "@/lib/sumRecords/sumRecords";
import { emitter } from "@/infrastructure/emitter/emitter";
import { ChildrenController } from "@/domain/shared/ChildrenController";
import { groupItemsByTime } from "@/domain/schedule/schedule.service";
import { ScheduleEventItem } from "@/domain/schedule/scheduleEvent/ScheduleEvent.model";
import { DishStore } from "@/store/DishStore/DishStore";
import { ContentControllerFood, FullContent } from "@/domain/shared/foodContent/foodContent";

export interface RootStoreEnv {
    dishStore: Instance<typeof DishStore>;
}

export type ScheduleItemType = Instance<typeof ScheduleItem>["type"];

export const ScheduleItem = types.compose("ScheduleItem", types.model({
    id: types.identifier,
    time: types.string,
    sync: types.optional(SyncStatus, {}),

}), ContentControllerFood)
    .actions(self => {
        function updateTime(time: string) {
            self.time = time;
        }

        return {
            updateTime
        }
    });

export const DaySchedule = types.model({
    id: types.identifier,
    userId: types.number,
    lastSync: types.optional(types.string, ""),
    lastTimeItemAdded: types.optional(types.string, ""),
    lastTimeEventAdded: types.optional(types.string, ""),
    foods: ChildrenController(ScheduleItem),
    events: ChildrenController(ScheduleEventItem),
})
    .views(self => ({
        getChildById(id: string): Instance<typeof ScheduleItem> | null {
            return self.foods.items.find(item => item.id.toString() === id) || null;
        },
        get customItems() {
            return self.foods.items.filter(item => item.content?.variant === "product" && item.content?.food?.createdByUser) || null;
        },
        get allDraftDishesFromItems() {
            return self.foods.items
                .filter(item => item.content?.variant === "dish" && item.content?.dish && !item.content.dish.lastSync)
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
                    patch.path.match(/items\/\d+\/content\/contentProduct\/\w+\/quantity/) ||
                    patch.path.match(/items\/\d+\/content\/contentDish\/\w+\/quantity/) ||
                    patch.path.match(/items\/\d+\/content\/contentProduct/) ||
                    patch.path.match(/items\/\d+\/content\/contentDish/) ||
                    patch.path.match(/items\/\d+\/content/) ||
                    patch.path === "/items" ||                         // полностью изменён
                    patch.path.match(/items\/\d+$/)                    // add/remove
                ) {
                    emitter.emit('CALCULATION_NEEDED')
                }
            })
        }

        function beforeDestroy() {
            disposer?.()
        }

        function getTotalNutrients() {
            const nutrients = self.foods.items.map(item => {
                if (item.content == null) return {}
                return item.content.getTotalNutrients() || {}
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

        function addOrUpdateEvent(itemId: string | null, state: { type: string, data: Record<string, unknown> | null, time: string }) {
            const { type, data, time } = state;

            // Извлекаем subtype из data, если он там есть
            const { subtype, ...restData } = (data as Record<string, unknown>) || {};

            if (!itemId) {
                self.events.addChildWithLocalData({
                    type,
                    time,
                    subtype: subtype as string[] || [],
                    data: restData,
                });
                return;
            }
            self.events.updateChildById({ id: itemId, type, subtype: subtype as string[] || [], data: restData, time });
        }

        return {
            updateEventTime,
            addOrUpdateEvent,
            // changeStatusByIds,
            updateTime,
            getTotalNutrients,
            afterCreate,
            beforeDestroy
        };
    })
