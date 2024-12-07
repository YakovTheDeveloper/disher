import { api, apiRoutes, AuthorizationHeader } from "@/api";
import { getTokenFromLocalStorage } from "@/lib/storage/localStorage";
import { CreateDishPayload, GetAllDishResponse, GetDishResponse, MenuCreateResponse, DishPayload, UpdateDishPayload } from "@/types/api/menu";

import { GetProductsPayload } from "@/types/api/product";


export type FoodCollection = 'menu' | 'dish'

export async function fetchCreateDish(payload: CreateDishPayload): Promise<MenuCreateResponse> {

    return await api.post(apiRoutes.dish.create, payload, AuthorizationHeader())
}

export async function fetchUpdateDish(id: number, payload: UpdateDishPayload): Promise<MenuCreateResponse> {
    return await api.patch(apiRoutes.dish.update(id), payload, AuthorizationHeader())
}


export async function fetchGetDish(id: number): Promise<GetDishResponse> {
    return await api.get(apiRoutes.dish.get(id), AuthorizationHeader())
}

export async function fetchGetAllDishes(): Promise<GetAllDishResponse> {
    return await api.get(apiRoutes.dish.getAll, AuthorizationHeader())
}


export async function fetchDeleteDish(id: number): Promise<any> {
    return await api.delete(apiRoutes.dish.delete(id), AuthorizationHeader())
}

export async function fetchGetDishProducts(dishIds: string[]) {
    return await api.get<GetProductsPayload>(apiRoutes.dishProducts.get(dishIds.toString()))
}