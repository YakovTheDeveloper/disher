import { api, apiRoutes, AuthorizationHeader } from "@/api";
import { getTokenFromLocalStorage } from "@/lib/storage/localStorage";
import { CreateMenuPayload, GetAllMenuResponse, GetMenuResponse, MenuCreateResponse, MenuPayload, UpdateMenuPayload } from "@/types/api/menu";

export type FoodCollection = 'menu' | 'dish'

export async function fetchCreateMenu(payload: CreateMenuPayload, foodCollection?: FoodCollection): Promise<MenuCreateResponse> {
    console.log('this.collectionType',foodCollection)

    return await api.post(apiRoutes.foodCollection(foodCollection).create, payload, AuthorizationHeader())
}

export async function fetchUpdateMenu(id: number, payload: UpdateMenuPayload, foodCollection?: FoodCollection): Promise<MenuCreateResponse> {
    return await api.patch(apiRoutes.foodCollection(foodCollection).update(id), payload, AuthorizationHeader())
}


export async function fetchGetMenu(id: number, foodCollection?: FoodCollection): Promise<GetMenuResponse> {
    return await api.get(apiRoutes.foodCollection(foodCollection).get(id), AuthorizationHeader())
}

export async function fetchGetAllMenu(foodCollection?: FoodCollection): Promise<GetAllMenuResponse> {
    return await api.get(apiRoutes.foodCollection(foodCollection).getAll, AuthorizationHeader())
}


export async function fetchDeleteMenu(id: number, foodCollection?: FoodCollection): Promise<GetMenuResponse> {
    return await api.delete(apiRoutes.foodCollection(foodCollection).delete(id), AuthorizationHeader())
}