import { api, apiRoutes, AuthorizationHeader } from "@/api";
import { getTokenFromLocalStorage } from "@/lib/storage/localStorage";
import { CreateMenuPayload, GetAllMenuResponse, GetMenuResponse, MenuCreateResponse, MenuPayload, UpdateMenuPayload } from "@/types/api/menu";

export type FoodCollection = 'menu' | 'dish'

export async function fetchCreateMenu(payload: CreateMenuPayload): Promise<MenuCreateResponse> {

    return await api.post(apiRoutes.dish.create, payload, AuthorizationHeader())
}

export async function fetchUpdateMenu(id: number, payload: UpdateMenuPayload): Promise<MenuCreateResponse> {
    return await api.patch(apiRoutes.dish.update(id), payload, AuthorizationHeader())
}


export async function fetchGetMenu(id: number): Promise<GetMenuResponse> {
    return await api.get(apiRoutes.dish.get(id), AuthorizationHeader())
}

export async function fetchGetAllMenu(): Promise<GetAllMenuResponse> {
    return await api.get(apiRoutes.dish.getAll, AuthorizationHeader())
}


export async function fetchDeleteMenu(id: number): Promise<any> {
    return await api.delete(apiRoutes.dish.delete(id), AuthorizationHeader())
}