import { Id, IdToQuantity } from "@/types/common/common";
import { Day } from "@/types/day/day";

export const PRODUCT_NUTRIENTS_INIT_DAY: Record<Id, IdToQuantity> = {
    1: {
        1: 10,
        2: 30
    },
    2: {
        1: 20,
        3: 10,
    },
    3: {
        1: 0,
        4: 100
    },
    4: {
        2: 10,
        3: 10
    },
    5: {
        1: 30,
        2: 0
    },
}

export const MockDay: Day = {
    id: 0,
    date: '',
    name: '1',
    categories: [
        {
            id: 0,
            name: '1',
            position: 0,
            dishes: [
                {
                    id: 1,
                    name: '1',
                    products: [
                        {
                            id: 1,
                            quantity: 200
                        },
                        {
                            id: 2,
                            quantity: 100
                        },
                    ],
                    quantity: 50
                },
                {
                    id: 2,
                    name: '1',
                    products: [
                        {
                            id: 3,
                            quantity: 250
                        },
                        {
                            id: 4,
                            quantity: 0
                        },
                    ],
                    quantity: 100
                },
            ]
        },
        {
            id: 1,
            name: '2',
            position: 0,
            dishes: [
                {
                    id: 3,
                    name: '1',
                    products: [
                        {
                            id: 1,
                            quantity: 200
                        },
                        {
                            id: 2,
                            quantity: 100
                        },
                    ],
                    quantity: 0
                },
                {
                    id: 4,
                    name: '1',
                    products: [
                        {
                            id: 4,
                            quantity: 1
                        },
                        {
                            id: 5,
                            quantity: 30
                        },
                    ],
                    quantity: 100
                },
            ]
        }
    ]
}