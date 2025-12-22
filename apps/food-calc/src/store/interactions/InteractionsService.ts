import { Dish } from "@/domain/dish/Dish";
import { AllScheduleItemContentTypes, DaySchedule, DishItemContent, ScheduleItem } from "@/domain/schedule/schedule";
import { DayScheduleStore } from "@/store/DayScheduleStore/DayScheduleStore";
import { DishStore } from "@/store/DishStore/DishStore";
import { domainStore } from "@/store/store";
import { DayScheduleApi, DishStoreApi, RootInstance } from "@/store/types";
import { flow, getEnv, getRoot, Instance, IStateTreeNode, types, walk } from "mobx-state-tree";

export interface InteractionsEnv {
    dishStore: Instance<typeof DishStore>;
    scheduleStore: Instance<typeof DayScheduleStore>
    daySchedule: DayScheduleApi;
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

        const fetchSyncScheduleAndDishes = async (payload: Instance<typeof DaySchedule>) => {
            const root = getRoot(self) as InteractionsEnv;

            const syncedDishes = await root.dishStore.fetchSync(
                payload.allDraftDishesFromItems
            );

            if (!syncedDishes) return;

            for (const item of syncedDishes) {
                if (item.dish) {
                    root.dishStore.addLocal({
                        id: String(item.dish.id),
                        name: item.dish.name,
                        isDraft: false,
                        items: item.dish.items.map(i => ({
                            id: String(i.id),
                            quantity: i.quantity,
                            foodId: String(i.foodId),
                            food: String(i.foodId),
                        })),
                    });
                }
            }

        };

        const fetchSyncDishes = async (payload: Instance<typeof Dish>[]) => {

            const root = getRoot(self) as InteractionsEnv;

            const syncedDishes = await root.dishStore.fetchSync(
                payload
            );

            if (!syncedDishes) return;

            for (const item of syncedDishes) {
                if (!item.dish) continue
                const id = item.dish.id
                const dishChildren = item.dish.items
                const localDish = root.dishStore.data.get(id)

                localDish?.removeChildrenMarkedAsDeleted()

                for (const dishChild of dishChildren) {
                    const { id, quantity, foodId } = dishChild
                    const localChild = localDish?.updateChildById(id, {
                        quantity, foodId: foodId.toString()
                    }, false)
                    localChild?.sync.onSync(Date.now().toString())
                    if (!localChild) {
                        localDish?.addChildWithServerData(foodId.toString(), { id, quantity })
                    }
                }
            }

        };

        // function* scenario(items: AllScheduleItemContentTypes[]) {

        //     foodIntoNewDish(items)

        // }

        return {
            fetchSyncDishes,
            fetchSyncScheduleAndDishes,
            createNewDishAndAppendToSchedule
        }
    });