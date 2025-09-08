import { api, apiRoutes, AuthorizationHeader } from "@/api";
import { getTokenFromLocalStorage } from "@/lib/storage/localStorage";
import { PaginanationParams } from "@/types/api/common";
import { GetAllDishParams } from "@/types/api/dish";
import { CreateDishPayload, GetAllDishResponse, GetDishResponse, MenuCreateResponse, DishPayload, UpdateDishPayload } from "@/types/api/menu";

import { GetProductsPayload } from "@/types/api/product";


export type FoodCollection = 'menu' | 'dish'

export async function fetchCreateDish(payload: CreateDishPayload): Promise<MenuCreateResponse> {

    return await api.post(apiRoutes.dish.create, payload)
}

export async function fetchUpdateDish(id: number, payload: UpdateDishPayload): Promise<MenuCreateResponse> {
    return await api.patch(apiRoutes.dish.update(id), payload)
}


export async function fetchGetDish(id: number): Promise<GetDishResponse> {
    return await api.get(apiRoutes.dish.get(id))
}

export async function fetchGetAllDishes(params: GetAllDishParams): Promise<GetAllDishResponse> {
    console.log("paramsparams", params)
    return await api.get(apiRoutes.dish.getAll, {
        params
    })
}


export async function fetchDeleteDish(id: number): Promise<any> {
    return await api.delete(apiRoutes.dish.delete(id))
}

export async function fetchGetDishProducts(dishIds: string[]) {
    return await api.get<GetProductsPayload>(apiRoutes.dishProducts.get(dishIds.toString()))
}