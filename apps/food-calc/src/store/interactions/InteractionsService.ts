import { Dish } from "@/domain/dish/Dish";
import { AllScheduleItemContentTypes, ScheduleItem } from "@/domain/schedule/schedule";
import { DayScheduleApi, DishStoreApi, RootInstance } from "@/store/types";
import { getEnv, getRoot, Instance, IStateTreeNode, types } from "mobx-state-tree";

export interface InteractionsEnv {
    dishStore: DishStoreApi;
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

        function onDishSaveFromScheduleFood(dishId: string, scheduleDate: string, time: string) {
            const root = getRoot(self) as InteractionsEnv;

            const schedule = root.daySchedule.getLocal(scheduleDate)
            const dish = root.dishStore.getLocal(dishId)
            if (!schedule || !dish) {
                console.error('no dish or schedule', schedule, dish)
                return
            }
            const dishItemIds = dish.items.map((item) => item.id.toString())
            schedule.addDishItem(dishId, { time });
            schedule.changeStatusByIds(dishItemIds);

        }

        // function* scenario(items: AllScheduleItemContentTypes[]) {

        //     foodIntoNewDish(items)

        // }

        return {
            onDishSaveFromScheduleFood,
            foodIntoNewDish
        }
    });