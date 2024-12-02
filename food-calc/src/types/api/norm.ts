import { DailyNorm } from "@/types/norm/norm";

export type DailyNormNoId = Omit<DailyNorm, 'id'>

export type CreateNormPayload = DailyNormNoId
export type UpdateNormPayload = DailyNormNoId
export type GetNormResponse = {
    result: DailyNorm[]
}
export type CreateNormResponse = {
    result: DailyNorm
}
export type UpdateNormResponse = {
    result: DailyNorm
}
export type NormResponse = {
    result: boolean
}