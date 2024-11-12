import { IdToQuantity } from "@/types/common/common";
import { IMenu, IProductBase, IProductWithNutrients } from "@/types/menu/Menu";

export type MenuPayload = {

    name: string

    description: string

    products: IdToQuantity;
}

export type CreateMenuPayload = MenuPayload
export type UpdateMenuPayload = MenuPayload

export type MenuCreateResponse = {

    name: string

    description: string

    id: string;
}

export type GetMenuResponse = {
    "result": {
        products: IProductWithNutrients[]
        dishIds: number[]
    },
    "error": null
}

export type GetAllMenuResponse = IMenu[]

