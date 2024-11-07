import { api, apiRoutes, AuthorizationHeader } from "@/api";
import { getTokenFromLocalStorage } from "@/lib/storage/localStorage";
import { CreateMenuPayload, GetAllMenuResponse, GetMenuResponse, MenuCreateResponse, MenuPayload } from "@/types/api/menu";

export async function fetchCreateMenu(payload: CreateMenuPayload): Promise<MenuCreateResponse> {
    return await api.post(apiRoutes.menu.create, payload, AuthorizationHeader())
}

export async function fetchGetMenu(id: number): Promise<GetMenuResponse> {
    return await api.get(apiRoutes.menu.get(id), AuthorizationHeader())
}

export async function fetchGetAllMenu(): Promise<GetAllMenuResponse> {
    return await api.get(apiRoutes.menu.getAll, AuthorizationHeader())
}