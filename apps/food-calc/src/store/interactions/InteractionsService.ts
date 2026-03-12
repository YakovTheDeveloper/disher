import { getIds } from "@/domain/common";
import { Dish } from "@/domain/dish/Dish.model";
import { ScheduleFood, DaySchedule } from "@/domain/schedule/schedule.model";
import { ScheduleFoodsItem } from "@/domain/schedule/scheduleFood/ScheduleFoods.model";
import toaster from "@/infrastructure/toaster/toaster";
import { isNotEmpty } from "@/lib/empty";
import { FoodScheduleStore } from "@/store/FoodScheduleStore/FoodScheduleStore";
import { DailyNormStore } from "@/store/DailyNormStore/DailyNormStore";
import { DishStore } from "@/store/DishStore/DishStore";
import { DishFactory } from "@/store/DishStore/Dish.factory";
import { GlobalUiStore } from "@/store/GlobalUiStore/GlobalUiStore";
import { domainStore } from "@/store/store";
import { getRoot, Instance, types } from "mobx-state-tree";
import { productFactory } from "@/domain/product/Food.factory";
import { DrawerStoreInstance } from "@/store/GlobalUiStore/DrawerStore/DrawerStore.v2";
import { FoodStoreInstance } from "@/store/FoodStore/FoodStore";
import { InteractionsCreate, InteractionsDelete } from "@/store/interactions/interactionsIndex";
import { InteractionsSelect } from "@/hooks/factoryHooks/useSelection";

export interface InteractionsEnv {
    dishStore: Instance<typeof DishStore>;
    foodScheduleStore: Instance<typeof FoodScheduleStore>
    dailyNormStore: Instance<typeof DailyNormStore>
    globalUiStore: Instance<typeof GlobalUiStore>
    drawerStore: DrawerStoreInstance;
    foodStore: FoodStoreInstance;
}

type CreateNewDishAndAppendToScheduleParam = {
    schedule: Instance<typeof DaySchedule>
    timeToAddDishScheduleItem: string
    removeScheduleItems: boolean
    interactionsSelect: InteractionsSelect
}

export const InteractionsService = types
    .model({

        interactionsCreate: types.optional(InteractionsCreate, {}),
        interactionsDelete: types.optional(InteractionsDelete, {}),
    })
    .actions(self => {

        function moveOrCopyItemsFromOneScheduleToAnother(fromDate: string, toDate: string, action: 'copy' | 'move', selectedIds: string[]) {
            const from = domainStore.foodScheduleStore.data.get(fromDate);
            if (!from) {
                console.warn('No FROM schedule found')
                return
            }
            const selectedFromSchedule = from.foods.getChildrenByIds(selectedIds);

            let to = domainStore.foodScheduleStore.data.get(toDate);

            if (!to) {
                console.warn('No schedule found to copy/move items TO')
                to = domainStore.foodScheduleStore.addLocal({
                    id: toDate
                })
            }

            to.foods.addBulkEachWithNewId(selectedFromSchedule)

            if (action === 'move') {
                from.foods.removeBulk(selectedIds)
            }
        }

        function createNewDishAndAppendToSchedule({ schedule, timeToAddDishScheduleItem, removeScheduleItems, interactionsSelect }: CreateNewDishAndAppendToScheduleParam) {
            const root = getRoot(self) as InteractionsEnv;
            const selectedIds = interactionsSelect.selectedIds

            const dishItemsPayload = schedule.foods.getChildrenByIds(selectedIds)

            const dish = root.dishStore.insert(DishFactory.createNewLocalFromScheduleProducts(dishItemsPayload))

            const dishId = dish.id
            // if (!dish) {
            //     console.error('no dish ', dish)
            //     return
            // }
            schedule.foods.addChildWithLocalData({ quantity: 100, time: timeToAddDishScheduleItem, content: { dishId, variant: 'dish' } });

            console.log('removeScheduleItems', removeScheduleItems, getIds(dish.items));
            if (removeScheduleItems) {
                schedule.foods.removeBulk(getIds(dish.items))
            }

            return dish

        }

        // const fetchSyncScheduleAndDishes = async (schedule: Instance<typeof ScheduleFood>) => {
        //     const root = getRoot(self) as InteractionsEnv;

        //     const notSyncedDishes = (schedule as any).allDraftDishesFromItems

        //     if (isNotEmpty(notSyncedDishes)) {
        //         const status = await fetchSyncDishes(notSyncedDishes)
        //         if (status === 'fail') return
        //     }

        //     const syncedSchedules = await root.foodScheduleStore.fetchSync(
        //         schedule
        //     );

        //     const id = schedule.id
        //     const children = (schedule as any).items

        //     const syncedSchedule = syncedSchedules?.at(0)
        //     if (!syncedSchedule?.schedule) {
        //         toaster.warning('Не удалось синхронизировать день')
        //         return
        //     }

        //     const local = root.foodScheduleStore.data.get(id)
        //     local?.removeChildrenMarkedAsDeleted()
        //     local?.addOrUpdateBulk(children)

        // };

        // const fetchSyncDishes = async (payload: Instance<typeof Dish>[]) => {

        //     const root = getRoot(self) as InteractionsEnv;

        //     const syncResult = await root.dishStore.fetchSync(
        //         payload
        //     );

        //     if (!syncResult?.dishes) return 'fail';

        //     for (const item of syncResult.dishes) {
        //         if (!item.dish) continue
        //         const id = item.dish.id
        //         const dishChildren = item.dish.items
        //         const localDish = root.dishStore.getEntity(id)

        //         localDish?.setLastSync()
        //         localDish?.removeChildrenMarkedAsDeleted()
        //         localDish?.addOrUpdateBulk(dishChildren)
        //     }

        //     return isNotEmpty(syncResult.notSyncIds) ? 'fail' : 'success'

        // };

        // const fetchGetDishes = async (id: string) => {
        //     const root = getRoot(self) as InteractionsEnv;

        //     const dishes = await root.dishStore.fetchGet(id)

        //     if (dishes?.data == null) return;

        //     for (const inputDish of dishes.data) {
        //         const id = inputDish.id
        //         const localDish = root.dishStore.getEntity(id)
        //         const dishChildren = inputDish.items
        //         localDish?.addOrUpdateBulk(dishChildren)
        //     }

        // }

        // function* scenario(items: AllScheduleItemContentTypes[]) {

        //     createDishFromScheduleFood(items)

        // }

        return {
            createNewDishAndAppendToSchedule,
            moveOrCopyItemsFromOneScheduleToAnother
        }
    });