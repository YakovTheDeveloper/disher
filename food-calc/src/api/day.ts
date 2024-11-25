import { api, apiRoutes, AuthorizationHeader } from "@/api"
import { CreateDayPayload, CreateDayResponse, GetAllDayResponse, UpdateDayPayload, UpdateDayResponse } from "@/types/api/day"

export async function fetchCreateDay(payload: CreateDayPayload): Promise<CreateDayResponse> {
    return await api.post(apiRoutes.day.create, payload, AuthorizationHeader())
}

export async function fetchUpdateDay(id: string, payload: UpdateDayPayload): Promise<UpdateDayResponse> {
    return await api.put(apiRoutes.day.update(id), payload, AuthorizationHeader())
}


export async function fetchGetDay(id: number): Promise<GetDayResponse> {
    return await api.get(apiRoutes.day.get(id), AuthorizationHeader())
}

export async function fetchGetAllDay(): Promise<GetAllDayResponse> {
    return await api.get(apiRoutes.day.getAll, AuthorizationHeader())
}


export async function fetchDeleteDay(id: number): Promise<any> {
    return await api.delete(apiRoutes.day.delete(id), AuthorizationHeader())
}