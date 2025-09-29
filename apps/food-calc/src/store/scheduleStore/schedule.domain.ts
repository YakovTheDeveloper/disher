import { getTotalDishFoodContentQuantity } from "@/store/models/dish/dish.domain";
import { GetTotalFoodAndDishFoodQuantityFromOneItemInput, FoodWithQuantity, GetTotalFoodAndDishFoodQuantityFromAllItemsInput } from "@/store/scheduleStore/schedule.domain.types"
import { ScheduleEntity } from "@/store/scheduleStore/types"

export function getScheduleProductsByTime(schedule: ScheduleEntity, time: string) {
    return schedule.items.filter((item) => item.time === time)
}

//todo tests with custom quantity
export function getTotalFoodAndDishFoodQuantityFromSchedule(item: GetTotalFoodAndDishFoodQuantityFromOneItemInput, customQuantity?: number): FoodWithQuantity[] {
    const quantity = customQuantity ?? item.quantity;
    if (item?.dish) {
        const dishItems = item.dish.items;
        const dishTotalWeight = getTotalDishFoodContentQuantity(dishItems)

        return dishItems.map(({ food: { id }, quantity }) => {
            const actualWeight = quantity * (quantity / dishTotalWeight);
            return {
                id,
                quantity: actualWeight
            };
        });
    }
    if (item?.food) {
        return [{
            id: item.food.id,
            quantity
        }]
    }
    return []
}

export function getTotalFoodAndDishFoodQuantityFromAll(items: GetTotalFoodAndDishFoodQuantityFromAllItemsInput): FoodWithQuantity[] {
    return items.flatMap((item) => getTotalFoodAndDishFoodQuantityFromSchedule(item))
}

export function getAllFoodIds(items: FoodWithQuantity[]) {
    return Array.from(new Set(items.map(({ id }) => id)));
}