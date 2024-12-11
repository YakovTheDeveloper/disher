import { DayCategoryDish } from "@/types/day/day";
import { IDish } from "@/types/dish/dish";
import { makeAutoObservable } from "mobx";

export class dayCategoryDishStore {

    constructor(data: DayCategoryDish) {
        this.init(data)
        makeAutoObservable(this)
    }

    id: number = -1

    // dish: IDish | null = null
    name: string = ''

    coefficient: number = 1

    products: {
        id: number;
        quantity: number;
    }[] = []

    init = (data: DayCategoryDish) => {
        const { coefficient, id, name, products } = data
        this.coefficient = coefficient
        this.id = id
        this.name = name
        this.products = products
    }


    updateCoefficient = (value: number) => this.coefficient = value

    get productIds() {
        return this.products.map(({ id }) => id)
    }

}

