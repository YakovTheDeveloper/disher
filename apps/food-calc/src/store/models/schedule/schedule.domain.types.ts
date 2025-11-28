import { ScheduleItemEntity } from "@/store/models/schedule/types";

export type GetTotalFoodAndDishFoodQuantityFromOneItemInput = {
    food?: ScheduleItemEntity["food"];
    dish?: ScheduleItemEntity["dish"];
    quantity: ScheduleItemEntity["quantity"];
    id?: string | number;
};

export type GetTotalFoodAndDishFoodQuantityFromAllItemsInput =
    GetTotalFoodAndDishFoodQuantityFromOneItemInput[];
