import { api, apiRoutes, AuthorizationHeader } from "@/api"
import { CreateNormPayload, CreateNormResponse, GetNormResponse, NormResponse, UpdateNormPayload, UpdateNormResponse } from "@/types/api/norm"


export async function fetchCreateNorm(payload: CreateNormPayload): Promise<CreateNormResponse> {
    return await api.post(apiRoutes.norm.create, payload, AuthorizationHeader())
}

export async function fetchUpdateNorm(id: number, payload: UpdateNormPayload): Promise<UpdateNormResponse> {
    return await api.put(apiRoutes.norm.update(id), payload, AuthorizationHeader())
}

export async function fetchGetAllNorm(): Promise<GetNormResponse> {
    return await api.get(apiRoutes.norm.getAll, AuthorizationHeader())
}

export async function fetchDeleteNorm(id: number): Promise<NormResponse> {
    return await api.delete(apiRoutes.norm.delete(id), AuthorizationHeader())
}