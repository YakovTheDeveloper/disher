import { CommonData } from "@/store/models/common/types"
import { DishModelStore } from "@/store/models/dish/dishModelStore"
import { FoodModelStore } from "@/store/models/food/foodModelStore"
import { makeAutoObservable } from "mobx"

type FilterVariants = 'dish' | 'food'
export type FilterOptions = Record<FilterVariants, boolean>
export type ScheduleContentSearchItem = {
    uid: string
    id: number
    name: string
    type: 'dish'
    items: {
        food: {
            id: number;
            name: string;
        };
        id: number;
        quantity: number;
    }[]
} | {
    uid: string
    id: number
    name: string
    type: 'food'
}

export class SearchViewModel {

    foodStore: FoodModelStore
    dishStore: DishModelStore

    constructor(foodStore: FoodModelStore, dishStore: DishModelStore) {
        this.foodStore = foodStore
        this.dishStore = dishStore
        makeAutoObservable(this)
    }

    filterText = ''

    filter: Record<FilterVariants, boolean> = {
        dish: false,
        food: true
    }

    setFilter = (variant: typeof this.filter) => {
        this.filter = variant
    }

    setFilterText = (text: string) => {
        this.filterText = text
    }

    private get dishesList(): ScheduleContentSearchItem[] {
        return Array.from(this.dishStore.data.values()).map(dish => ({
            uid: `dish-${dish.id}`,
            id: dish.id,
            name: dish.name,
            type: "dish",
            items: dish.items
        }))
    }

    private get foodList(): ScheduleContentSearchItem[] {
        return Array.from(this.foodStore.data.values()).map(food => ({
            uid: `food-${food.id}`,
            id: food.id,
            name: food.name,
            type: "food",
        }))
    }

    private get allList() {
        return [...this.dishesList, ...this.foodList]
    }

    get filtered() {
        let baseList: any[] = []

        if (this.filter.dish && this.filter.food) {
            baseList = this.allList
        } else if (this.filter.dish) {
            baseList = this.dishesList
        } else if (this.filter.food) {
            baseList = this.foodList
        }

        if (!this.filterText.trim()) {
            return baseList
        }

        const lower = this.filterText.toLowerCase()
        return baseList.filter(item => {
            // assume each item has "name" or "title"
            const label = (item.name ?? item.title ?? "").toString().toLowerCase()
            return label.includes(lower)
        })
    }
}