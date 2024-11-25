import { api, apiRoutes, AuthorizationHeader } from "@/api";
import { getTokenFromLocalStorage } from "@/lib/storage/localStorage";
import { CreateMenuPayload, GetAllMenuResponse, GetMenuResponse, MenuCreateResponse, MenuPayload, UpdateMenuPayload } from "@/types/api/menu";

export type FoodCollection = 'menu' | 'dish'

export async function fetchCreateMenu(payload: CreateMenuPayload): Promise<MenuCreateResponse> {

    return await api.post(apiRoutes.dish.create, payload, AuthorizationHeader())
}

export async function fetchUpdateMenu(id: number, payload: UpdateMenuPayload, foodCollection?: FoodCollection): Promise<MenuCreateResponse> {
    return await api.patch(apiRoutes.dish.update(id), payload, AuthorizationHeader())
}


export async function fetchGetMenu(id: number, foodCollection?: FoodCollection): Promise<GetMenuResponse> {
    return await api.get(apiRoutes.dish.get(id), AuthorizationHeader())
}

export async function fetchGetAllMenu(foodCollection?: FoodCollection): Promise<GetAllMenuResponse> {
    return await api.get(apiRoutes.dish.getAll, AuthorizationHeader())
}


export async function fetchDeleteMenu(id: number, foodCollection?: FoodCollection): Promise<any> {
    return await api.delete(apiRoutes.dish.delete(id), AuthorizationHeader())
}