import { getIds } from "@/domain/common";
import { Dish } from "@/domain/dish/Dish.model";
import { DaySchedule, ScheduleItem } from "@/domain/schedule/schedule.model";
import toaster from "@/infrastructure/toaster/toaster";
import { isNotEmpty } from "@/lib/empty";
import { DayScheduleStore } from "@/store/DayScheduleStore/DayScheduleStore";
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

export interface InteractionsEnv {
    dishStore: Instance<typeof DishStore>;
    scheduleStore: Instance<typeof DayScheduleStore>
    dailyNormStore: Instance<typeof DailyNormStore>
    globalUiStore: Instance<typeof GlobalUiStore>
    drawerStore: DrawerStoreInstance;
    foodStore: FoodStoreInstance;
}

type CreateNewDishAndAppendToScheduleParam = {
    schedule: Instance<typeof DaySchedule>
    timeToAddDishScheduleItem: string
    removeScheduleItems: boolean
}

export const InteractionsService = types
    .model({

        interactionsCreate: types.optional(InteractionsCreate, {}),
        interactionsDelete: types.optional(InteractionsDelete, {}),

        interactionsSelect: types.optional(types.model({
            isActionsMode: false,
            selectedIds: types.array(types.string),
        }).actions(self => ({
            setIsActionsMode(value: boolean) {
                self.isActionsMode = value;

                if (!value) {
                    self.selectedIds.clear();
                }
            },

            toggleSelectedId(id: string) {
                const index = self.selectedIds.indexOf(id);

                if (index >= 0) {
                    self.selectedIds.splice(index, 1);
                } else {
                    self.selectedIds.push(id);
                }

                self.isActionsMode = self.selectedIds.length > 0;
            },

            setSelectedIds(ids: string[]) {
                const selectedSet = new Set(self.selectedIds);
                const idsSet = new Set(ids);

                if (ids.every(id => selectedSet.has(id))) {
                    self.selectedIds.replace(self.selectedIds.filter(id => !idsSet.has(id)));
                } else {
                    ids.forEach(id => {
                        if (!selectedSet.has(id)) {
                            self.selectedIds.push(id);
                        }
                    });
                }

                self.isActionsMode = self.selectedIds.length > 0;
            },

            clearSelection() {
                self.selectedIds.clear();
                self.isActionsMode = false;
            },
        })).views(self => ({
            isSelected(id: string) {
                return self.selectedIds.includes(id);
            },

            get selectedCount() {
                return self.selectedIds.length;
            },
        })), {})
    })
    .actions(self => {

        function moveOrCopyItemsFromOneScheduleToAnother(fromDate: string, toDate: string, action: 'copy' | 'move') {
            const selectedIds = self.interactionsSelect.selectedIds;

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
                from.foods.removeBulk(selectedIds)
            }

            domainStore.interactionsService.interactionsSelect.clearSelection()

        }

        function createNewDishAndAppendToSchedule({ schedule, timeToAddDishScheduleItem, removeScheduleItems }: CreateNewDishAndAppendToScheduleParam) {
            const root = getRoot(self) as InteractionsEnv;
            const selectedIds = self.interactionsSelect.selectedIds

            const dishItemsPayload = schedule.foods.getChildrenByIds(selectedIds)

            const dish = root.dishStore.user.insert(DishFactory.createNewLocalFromScheduleProducts(dishItemsPayload))

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
                const localDish = root.dishStore.getEntity(id)

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
        //         const localDish = root.dishStore.getEntity(id)
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