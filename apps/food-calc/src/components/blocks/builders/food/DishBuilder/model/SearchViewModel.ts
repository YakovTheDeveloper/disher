import { CommonData } from "@/store/models/common/types"
import { DishModelStore } from "@/store/models/dish/dishStore"
import { FoodModelStore } from "@/store/models/food/foodModelStore"
import { makeAutoObservable } from "mobx"

type FilterVariants = 'dish' | 'food'
export type FilterOptions = Record<FilterVariants, boolean>
export type UICollectionItem = {
    uid: string   // unique across all stores
    id: string | number
    name: string
    type: string
}

export class SearchViewModel {

    foodStore: FoodModelStore

    constructor(foodStore: FoodModelStore) {
        this.foodStore = foodStore
        makeAutoObservable(this)
    }

    filterText = ''

    setFilterText = (text: string) => {
        this.filterText = text
    }

    private get foodList(): UICollectionItem[] {
        return Array.from(this.foodStore.data.values()).map(food => ({
            uid: `food-${food.id}`,
            id: food.id,
            name: food.name,
            type: "food",
        }))
    }

    get filtered() {
        const lower = this.filterText.toLowerCase()
        return this.foodList.filter(item => {
            const label = (item.name ?? "").toString().toLowerCase()
            return label.includes(lower)
        })
    }
}