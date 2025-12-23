import { Dish } from "@/domain/dish/Dish";
import { AllScheduleItemContentTypes, DaySchedule, DishItemContent, ScheduleItem } from "@/domain/schedule/schedule";
import toaster from "@/infrastructure/toaster/toaster";
import { isEmpty, isNotEmpty } from "@/lib/empty";
import { DayScheduleStore } from "@/store/DayScheduleStore/DayScheduleStore";
import { DishStore } from "@/store/DishStore/DishStore";
import { domainStore } from "@/store/store";
import { DayScheduleApi, DishStoreApi, RootInstance } from "@/store/types";
import { flow, getEnv, getRoot, Instance, IStateTreeNode, types, walk } from "mobx-state-tree";

export interface InteractionsEnv {
    dishStore: Instance<typeof DishStore>;
    scheduleStore: Instance<typeof DayScheduleStore>
}

export const InteractionsService = types
    .model({})
    .actions(self => {

        function foodIntoNewDish(items: Instance<typeof ScheduleItem>[]) {
            const root = getRoot(self) as InteractionsEnv;
            // const root = getRoot(self) as IStateTreeNode as RootInstance; // if needed

            const onlyFoodItems = items
                .filter(el => el.content.type === 'food' && el.status !== 'deleted')
                .map(el => ({
                    id: el.id,
                    foodId: String(el.content.foodId),
                    food: String(el.content.foodId),
                    quantity: el.quantity,
                    status: "added" as const,
                }));

            const init = {
                items: onlyFoodItems,
                isDraft: true,
            }
            return root.dishStore.addLocal(init)
        }

        function onDishSaveFromScheduleFood(dish: Instance<typeof Dish>, schedule: Instance<typeof DaySchedule>, time: string) {
            const dishId = dish.id
            if (!schedule || !dish) {
                console.error('no dish or schedule', schedule, dish)
                return
            }
            const dishItemIds = dish.items.map((item) => item.id.toString())
            schedule.addDishItem(dishId, { time });
            schedule.changeStatusByIds(dishItemIds);

        }

        function createNewDishAndAppendToSchedule(schedule: Instance<typeof DaySchedule>, timeGroupItems: Instance<typeof ScheduleItem>[], time: string) {
            const dish = foodIntoNewDish(timeGroupItems)
            onDishSaveFromScheduleFood(dish, schedule, time)
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

        //     foodIntoNewDish(items)

        // }

        return {
            fetchSyncDishes,
            fetchSyncScheduleAndDishes,
            createNewDishAndAppendToSchedule
        }
    });