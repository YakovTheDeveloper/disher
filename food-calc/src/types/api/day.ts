import { Response } from "@/types/api/common"
import { Day } from "@/types/day/day"

export type DayPayload = Omit<Day, 'id'>

export type CreateDayResponse = Response<Day>

export type GetAllDayResponse = Response<Day[]>

export type CreateDayPayload = DayPayload

export type UpdateDayPayload = DayPayload

export type UpdateDayResponse = CreateDayResponse