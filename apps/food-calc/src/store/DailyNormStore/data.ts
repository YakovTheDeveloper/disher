export const STANDARD_NORM_ID = 'STANDARD'
export const STANDARD_NORM_ID_2 = 'STANDARD_2'

export const defaultDailyNorm = {
    id: STANDARD_NORM_ID,
    name: 'Стандартная',
    description: '',
    items: [
        { id: "1", "nutrientId": "1", "quantity": 51 },
        { id: "2", "nutrientId": "2", "quantity": 70 },
        { id: "3", "nutrientId": "3", "quantity": 275 },
        { id: "4", "nutrientId": "4", "quantity": 50 },
        { id: "5", "nutrientId": "5", "quantity": 30 },
        { id: "6", "nutrientId": "6", "quantity": 25 },
        { id: "7", "nutrientId": "7", "quantity": 2000 },
        { id: "8", "nutrientId": "8", "quantity": 2000 },
        { id: "9", "nutrientId": "9", "quantity": 18 },
        { id: "10", "nutrientId": "10", "quantity": 1000 },
        { id: "11", "nutrientId": "11", "quantity": 350 },
        { id: "12", "nutrientId": "12", "quantity": 700 },
        { id: "13", "nutrientId": "13", "quantity": 3500 },
        { id: "14", "nutrientId": "14", "quantity": 2300 },
        { id: "15", "nutrientId": "15", "quantity": 15 },
        { id: "16", "nutrientId": "16", "quantity": 900 },
        { id: "17", "nutrientId": "17", "quantity": 2300 },
        { id: "18", "nutrientId": "18", "quantity": 55 },
        { id: "19", "nutrientId": "19", "quantity": 150 },
        { id: "20", "nutrientId": "20", "quantity": 900 },
        { id: "21", "nutrientId": "21", "quantity": 1.2 },
        { id: "22", "nutrientId": "22", "quantity": 1.3 },
        { id: "23", "nutrientId": "23", "quantity": 16 },
        { id: "24", "nutrientId": "24", "quantity": 550 },
        { id: "25", "nutrientId": "25", "quantity": 5 },
        { id: "26", "nutrientId": "26", "quantity": 2 },
        { id: "27", "nutrientId": "28", "quantity": 400 },
        { id: "28", "nutrientId": "29", "quantity": 2.4 },
        { id: "29", "nutrientId": "30", "quantity": 90 },
        { id: "30", "nutrientId": "31", "quantity": 20 },
        { id: "31", "nutrientId": "32", "quantity": 15 },
        { id: "32", "nutrientId": "33", "quantity": 120 },
        { id: "33", "nutrientId": "34", "quantity": 3000 },
        { id: "34", "nutrientId": "35", "quantity": 600 }
    ]

}

export const defaultNorms = {
    [String(STANDARD_NORM_ID)]: Object.freeze(defaultDailyNorm),
    [String(STANDARD_NORM_ID_2)]: Object.freeze(defaultDailyNorm)
}
