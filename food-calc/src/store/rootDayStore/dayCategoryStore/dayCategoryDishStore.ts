import { DayCategoryDish } from "@/types/day/day";
import { IDish } from "@/types/dish/dish";
import { makeAutoObservable } from "mobx";

type Product = {
    id: number;
    quantity: number;
}

export class dayCategoryDishStore {

    constructor(data: DayCategoryDish) {
        this.init(data)
        makeAutoObservable(this)
    }

    id: number = -1

    name: string = ''

    quantity: number = 100

    isOriginalValuesUse: boolean = true

    products: Product[] = []

    init = (data: DayCategoryDish) => {
        const { quantity, id, name, products, isOriginalValuesUse = true } = data
        this.quantity = quantity
        this.id = id
        this.name = name
        this.products = products
        this.isOriginalValuesUse = isOriginalValuesUse
    }

    updateQuantity = (quantity: number) => this.quantity = quantity
    setIsOriginalValuesUseUsed = (value: boolean) => this.isOriginalValuesUse = value

    get productIds() {
        return this.products.map(({ id }) => id)
    }

    update = (name: string, products: Product[]) => {
        this.products = products
        this.name = name
    }

}

