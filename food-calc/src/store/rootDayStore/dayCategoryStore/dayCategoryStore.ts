import { dayCategoryDishStore } from "@/store/rootDayStore/dayCategoryStore/dayCategoryDishStore";
import { DayStore2 } from "@/store/rootDayStore/dayStore2";
import { DayCategory, DayCategoryDish } from "@/types/day/day";
import { GenerateId } from "@/utils/uuidNumber";
import { action, computed, makeAutoObservable, makeObservable, observable } from "mobx";
import { v4 as uuidv4 } from 'uuid';

export class DayCategoryStore {

    constructor(private day: DayStore2, category: DayCategory) {
        this.init(category)
        makeObservable(this, {
            id: observable,
            name: observable,
            dishes: observable,
            position: observable,
            setAsCurrent: action,
            remove: action,
            updateName: action,
            removeDish: action,
            toggleDish: action,
            init: action,
            uniqueProductIds: computed
        })
    }

    id: number = GenerateId();

    name = 'Новая категория'

    dishes: dayCategoryDishStore[] = []

    position: number = 0

    setAsCurrent = () => {
        this.day.setCurrentCategoryId(this.id)
    }

    isDishInCategory = (dishId: number) => {
        return this.dishes.some(({ id }) => id === dishId)
    }

    removeDish = (dishId: number) => {
        this.dishes = this.dishes.filter(({ id }) => id != dishId)
    }

    toggleDish = (dish: DayCategoryDish) => {
        const dishExist = this.dishes.find(({ id }) => id === dish.id)
        if (dishExist) {
            this.dishes = this.dishes.filter(({ id }) => id !== dish.id)
            return
        }
        this.dishes.push(new dayCategoryDishStore(dish))
    }


    init = (category: DayCategory) => {
        const { dishes = [], id, name, position } = category
        this.dishes = dishes.map(dish => new dayCategoryDishStore(dish))
        this.id = id
        this.name = name
        this.position = position
    }

    updateName = (name: string) => this.name = name

    remove = () => this.day.removeCategory(this.id)

    get uniqueProductIds() {
        return [...new Set(this.dishes.flatMap(dish => dish.productIds))]
    }

}

export const createDraftDayCategory = (data?: Partial<DayCategory>): DayCategory => {
    let result: DayCategory = {
        id: GenerateId(),
        name: 'Новая категория',
        dishes: [],
        position: 0,
    }
    if (data) result = { ...result, ...data }
    return result
}