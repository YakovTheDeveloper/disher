import { Response } from "@/types/api/common";
import { DailyNorm } from "@/types/norm/norm";

export type DailyNormNoId = Omit<DailyNorm, 'id'>

export type CreateNormPayload = DailyNormNoId
export type UpdateNormPayload = DailyNormNoId
export type GetNormResponse = Response<DailyNorm[]>
export type CreateNormResponse = Response<DailyNorm>
export type UpdateNormResponse = Response<DailyNorm>
export type NormResponse = Response<boolean>