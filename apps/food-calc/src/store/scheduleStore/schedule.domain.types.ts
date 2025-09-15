import { ScheduleItemEntity } from "@/store/scheduleStore/types";

export type FoodWithQuantity = {
    id: number;
    quantity: number;
};

export type GetTotalFoodAndDishFoodQuantityFromOneItemInput = {
    food?: ScheduleItemEntity["food"];
    dish?: ScheduleItemEntity["dish"];
    quantity: ScheduleItemEntity["quantity"];
    id?: string | number;
};

export type GetTotalFoodAndDishFoodQuantityFromAllItemsInput =
    GetTotalFoodAndDishFoodQuantityFromOneItemInput[];
