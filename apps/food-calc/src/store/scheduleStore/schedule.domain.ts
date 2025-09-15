import { GetTotalFoodAndDishFoodQuantityFromOneItemInput, FoodWithQuantity, GetTotalFoodAndDishFoodQuantityFromAllItemsInput } from "@/store/scheduleStore/schedule.domain.types"
import { ScheduleEntity } from "@/store/scheduleStore/types"

export function getScheduleProductsByTime(schedule: ScheduleEntity, time: string) {
    return schedule.items.filter((item) => item.time === time)
}

export function getTotalFoodAndDishFoodQuantityFromOne(item: GetTotalFoodAndDishFoodQuantityFromOneItemInput): FoodWithQuantity[] {
    if (item?.dish) {
        return item?.dish.items.map(({ food: { id }, quantity }) => ({
            id,
            quantity
        }))
    }
    if (item?.food) {
        return [{
            id: item.food.id,
            quantity: item.quantity
        }]
    }
    return []
}

export function getTotalFoodAndDishFoodQuantityFromAll(items: GetTotalFoodAndDishFoodQuantityFromAllItemsInput): FoodWithQuantity[] {
    return items.flatMap(getTotalFoodAndDishFoodQuantityFromOne)
}

export function getAllFoodIds(items: FoodWithQuantity[]) {
    return Array.from(new Set(items.map(({ id }) => id)));
}