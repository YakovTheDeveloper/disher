import { getIds } from "@/domain/common";
import { Dish } from "@/domain/dish/Dish";
import { DaySchedule, ScheduleItem } from "@/domain/schedule/schedule";
import toaster from "@/infrastructure/toaster/toaster";
import { isNotEmpty } from "@/lib/empty";
import { DayScheduleStore } from "@/store/DayScheduleStore/DayScheduleStore";
import { DishStore } from "@/store/DishStore/DishStore";
import { GlobalUiStore } from "@/store/GlobalUiStore/GlobalUiStore";
import { domainStore } from "@/store/store";
import { DDMMYYYY } from "@/types/common/timeAndDate";
import { getRoot, Instance, types, getSnapshot } from "mobx-state-tree";

export interface InteractionsEnv {
    dishStore: Instance<typeof DishStore>;
    scheduleStore: Instance<typeof DayScheduleStore>
    globalUiStore: Instance<typeof GlobalUiStore>
}

type CreateNewDishAndAppendToScheduleParam = {
    schedule: Instance<typeof DaySchedule>
    timeToAddDishScheduleItem: string
    removeScheduleItems: boolean
}

export const InteractionsService = types
    .model({})
    .actions(self => {

        function moveOrCopyItemsFromOneScheduleToAnother(fromDate: string, toDate: string, action: 'copy' | 'move') {
            const selectedIds = domainStore.globalUiStore.selectedIds;

            const from = domainStore.scheduleStore.data.get(fromDate);
            if (!from) {
                console.warn('No FROM schedule found')
                return
            }
            const selectedFromSchedule = from.foods.getChildrenByIds(selectedIds);

            let to = domainStore.scheduleStore.data.get(toDate);

            if (!to) {
                console.warn('No schedule found to copy/move items TO')
                to = domainStore.scheduleStore.addLocal({
                    id: toDate
                })
            }

            to.foods.addBulkEachWithNewId(selectedFromSchedule)

            if (action === 'move') {
                from.foods.removeChildren(selectedIds)
            }

            domainStore.globalUiStore.clearSelection()

        }

        function createNewDishAndAppendToSchedule({ schedule, timeToAddDishScheduleItem, removeScheduleItems }: CreateNewDishAndAppendToScheduleParam) {
            const root = getRoot(self) as InteractionsEnv;
            const selectedIds = root.globalUiStore.selectedIds

            const dishItemsPayload = schedule.foods.getChildrenByIds(selectedIds)

            const dish = root.dishStore.addLocal({
                variant: 'fromScheduleFood',
                payload: dishItemsPayload
            })!

            const dishId = dish.id
            if (!dish) {
                console.error('no dish ', dish)
                return
            }
            schedule.foods.addChildWithLocalData({ quantity: 100, time: timeToAddDishScheduleItem, content: { dishId, variant: 'dish' } });

            console.log('removeScheduleItems', removeScheduleItems, getIds(dish.items));
            if (removeScheduleItems) {
                schedule.foods.removeChildren(getIds(dish.items))
            }

            return dish

        }

        const fetchSyncScheduleAndDishes = async (schedule: Instance<typeof DaySchedule>) => {
            const root = getRoot(self) as InteractionsEnv;

            const notSyncedDishes = schedule.allDraftDishesFromItems

            if (isNotEmpty(notSyncedDishes)) {
                const status = await fetchSyncDishes(notSyncedDishes)
                if (status === 'fail') return
            }

            const syncedSchedules = await root.scheduleStore.fetchSync(
                schedule
            );

            const id = schedule.id
            const children = schedule.items

            const syncedSchedule = syncedSchedules?.at(0)
            if (!syncedSchedule?.schedule) {
                toaster.warning('Не удалось синхронизировать день')
                return
            }

            const local = root.scheduleStore.data.get(id)
            local?.removeChildrenMarkedAsDeleted()
            local?.addOrUpdateBulk(children)

        };

        const fetchSyncDishes = async (payload: Instance<typeof Dish>[]) => {

            const root = getRoot(self) as InteractionsEnv;

            const syncResult = await root.dishStore.fetchSync(
                payload
            );

            if (!syncResult?.dishes) return 'fail';

            for (const item of syncResult.dishes) {
                if (!item.dish) continue
                const id = item.dish.id
                const dishChildren = item.dish.items
                const localDish = root.dishStore.data.get(id)

                localDish?.setLastSync()
                localDish?.removeChildrenMarkedAsDeleted()
                localDish?.addOrUpdateBulk(dishChildren)
            }

            return isNotEmpty(syncResult.notSyncIds) ? 'fail' : 'success'

        };

        // const fetchGetDishes = async (id: string) => {
        //     const root = getRoot(self) as InteractionsEnv;

        //     const dishes = await root.dishStore.fetchGet(id)

        //     if (dishes?.data == null) return;

        //     for (const inputDish of dishes.data) {
        //         const id = inputDish.id
        //         const localDish = root.dishStore.data.get(id)
        //         const dishChildren = inputDish.items
        //         localDish?.addOrUpdateBulk(dishChildren)
        //     }

        // }

        // function* scenario(items: AllScheduleItemContentTypes[]) {

        //     createDishFromScheduleFood(items)

        // }

        return {
            fetchSyncDishes,
            fetchSyncScheduleAndDishes,
            createNewDishAndAppendToSchedule,
            moveOrCopyItemsFromOneScheduleToAnother
        }
    });