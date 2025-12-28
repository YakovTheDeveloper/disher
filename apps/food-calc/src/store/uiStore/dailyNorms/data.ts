import { DailyNormEntityUI } from "@/components/features/DailyNorms/viewModel/DailyNormsViewModel"
export const STANDARD_NORM_ID = 'STANDARD'
export const STANDARD_NORM_ID_2 = 'STANDARD_2'

export const defaultDailyNorm = {
    id: STANDARD_NORM_ID,
    name: 'Стандартная',
    description: '',
    items: [
        { "nutrientId": 1, "quantity": 51 },
        { "nutrientId": 2, "quantity": 70 },
        { "nutrientId": 3, "quantity": 275 },
        { "nutrientId": 4, "quantity": 50 },
        { "nutrientId": 5, "quantity": 30 },
        { "nutrientId": 6, "quantity": 25 },
        { "nutrientId": 7, "quantity": 2000 },
        { "nutrientId": 8, "quantity": 2000 },
        { "nutrientId": 9, "quantity": 18 },
        { "nutrientId": 10, "quantity": 1000 },
        { "nutrientId": 11, "quantity": 350 },
        { "nutrientId": 12, "quantity": 700 },
        { "nutrientId": 13, "quantity": 3500 },
        { "nutrientId": 14, "quantity": 2300 },
        { "nutrientId": 15, "quantity": 15 },
        { "nutrientId": 16, "quantity": 900 },
        { "nutrientId": 17, "quantity": 2300 },
        { "nutrientId": 18, "quantity": 55 },
        { "nutrientId": 19, "quantity": 150 },
        { "nutrientId": 20, "quantity": 900 },
        { "nutrientId": 21, "quantity": 1.2 },
        { "nutrientId": 22, "quantity": 1.3 },
        { "nutrientId": 23, "quantity": 16 },
        { "nutrientId": 24, "quantity": 550 },
        { "nutrientId": 25, "quantity": 5 },
        { "nutrientId": 26, "quantity": 2 },
        { "nutrientId": 28, "quantity": 400 },
        { "nutrientId": 29, "quantity": 2.4 },
        { "nutrientId": 30, "quantity": 90 },
        { "nutrientId": 31, "quantity": 20 },
        { "nutrientId": 32, "quantity": 15 },
        { "nutrientId": 33, "quantity": 120 },
        { "nutrientId": 34, "quantity": 3000 },
        { "nutrientId": 35, "quantity": 600 }
    ]

}

export const defaultNorms: Record<string, DailyNormEntityUI> = {
    [String(STANDARD_NORM_ID)]: Object.freeze(defaultDailyNorm),
    [String(STANDARD_NORM_ID_2)]: Object.freeze(defaultDailyNorm)
}
