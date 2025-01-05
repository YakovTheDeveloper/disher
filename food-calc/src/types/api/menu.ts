import { PaginanationParams, Response } from "@/types/api/common";
import { IdToQuantity } from "@/types/common/common";
import { IMenu, IProductBase, IProductWithNutrients } from "@/types/menu/Menu";

export type DishPayload = {

    name: string

    description?: string

    products: IProductBase[];
}

export type CreateDishPayload = DishPayload
export type UpdateDishPayload = DishPayload

export type MenuCreateResponse = Response<
    {

        name: string

        description: string

        id: number;
        products: IProductBase[];

    }
>

export type GetDishResponse = Response<{
    products: IProductWithNutrients[]
    dishIds: number[]
}>

// {
//     "result": {
//         products: IProductWithNutrients[]
//         dishIds: number[]
//     },
//     "error": null
// }

export type GetAllDishResponse = Response<{
    content: IMenu[]
    itemsCount: number
}>

