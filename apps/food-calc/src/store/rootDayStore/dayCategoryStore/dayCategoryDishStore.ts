import { RootDishStore } from "@/store/rootDishStore/rootDishStore";
import { rootDishStore } from "@/store/rootStore";
import { DayCategoryDish } from "@/types/day/day";
import { IDish } from "@/types/dish/dish";
import { makeAutoObservable, toJS } from "mobx";

type Product = {
    id: number;
    quantity: number;
}

export class DayCategoryDishStore {

    constructor(data: DayCategoryDish, private dishesStore: RootDishStore = rootDishStore) {
        this.init(data)
        makeAutoObservable(this)
    }

    id: number = -1

    // name: string = ''

    quantity: number = 100

    products: Product[] = []

    get name() {
        const correspondingDishStore = this.dishesStore.userStoresMap[this.id]
        return correspondingDishStore ? correspondingDishStore.name : 'Без имени'
    }

    get portions() {
        const correspondingDishStore = this.dishesStore.userStoresMap[this.id]
        const portions = correspondingDishStore.portionStore.portionsRaw
        return portions
    }

    init = (data: DayCategoryDish) => {
        const { quantity, id, name, products } = data
        this.quantity = quantity
        this.id = id
        // this.name = ''
        this.products = products
    }

    updateQuantity = (quantity: number) => this.quantity = quantity

    get productIds() {
        return this.products.map(({ id }) => id)
    }

    // update = (name: string, products: Product[]) => {
    //     this.products = products
    //     this.name = name
    // }

}

