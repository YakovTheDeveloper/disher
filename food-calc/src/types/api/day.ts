
type DayContent = {
    name: string
    position: number
    dishes: DayContentDish[]
}

type DayContentDish = {
    id: string,
    position: number
}

type DayContentDishWithName = {
    id: string,
    position: number
    name: string
}

export type DayPayload = {
    name: string
    categories: DayContent
}

export type CreateDayResponse = {
    result: {
        id: number,
        name: string,
        categories: {
            id: string,
            name: string,
            position: number,
            dishes: DayContentDishWithName[]
        }[]
    }
}


export type GetAllDayResponse = {
    result: {
        id: number,
        name: string,
        categories: {
            id: string,
            name: string,
            position: number,
            dishes: DayContentDishWithName[]
        }[]
    }[]
}

export type CreateDayPayload = DayPayload
export type UpdateDayPayload = DayPayload
export type UpdateDayResponse = CreateDayResponse