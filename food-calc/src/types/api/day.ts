import { Day } from "@/types/day/day"

export type DayPayload = Omit<Day, 'id'>

export type CreateDayResponse = {
    result: Day
}

export type GetAllDayResponse = {
    result: Day[]
}

export type CreateDayPayload = DayPayload

export type UpdateDayPayload = DayPayload

export type UpdateDayResponse = CreateDayResponse