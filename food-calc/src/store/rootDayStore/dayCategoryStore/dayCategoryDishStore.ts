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

    products: Product[] = []

    init = (data: DayCategoryDish) => {
        const { quantity, id, name, products } = data
        this.quantity = quantity
        this.id = id
        this.name = name
        this.products = products
    }

    updateQuantity = (quantity: number) => this.quantity = quantity

    get productIds() {
        return this.products.map(({ id }) => id)
    }

    update = (name: string, products: Product[]) => {
        this.products = products
        this.name = name
    }

}

