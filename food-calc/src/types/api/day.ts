import { ISODate } from "@/types/common/common"
import { DayCategory, DayCategoryDish } from "@/types/day/day"

type DayContent = {
    name: string
    position: number
    dishes: DayCategoryDish[]
}

export type DayPayload = {
    name: string
    categories: DayContent
    date: ISODate
}

export type CreateDayResponse = {
    result: {
        id: number,
        name: string,
        categories: DayCategory[]
    }
}


export type GetAllDayResponse = {
    result: {
        id: number,
        date: string,
        name: string,
        categories: DayCategory[]
    }[]
}

export type CreateDayPayload = DayPayload
export type UpdateDayPayload = DayPayload
export type UpdateDayResponse = CreateDayResponse