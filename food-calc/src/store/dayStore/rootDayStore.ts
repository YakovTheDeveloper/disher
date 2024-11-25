import { fetchCreateDay, fetchDeleteDay, fetchGetAllDay, fetchUpdateDay } from "@/api/day";
import { CreateDayPayload } from "@/types/api/day";
import { autorun, makeAutoObservable, toJS } from "mobx"
import { v4 as uuidv4 } from 'uuid';




export class RootDayStore {
    constructor() {
        makeAutoObservable(this)

        autorun(() => {

            this.getDays()
        })
    }

    draftDayStore: DayStore = new DayStore(this)
    userDayStores: DayStore[] = []

    get allStores() {
        return [this.draftDayStore, ...this.userDayStores]
    }

    findDayStore = (dayId: string) => {
        return [this.draftDayStore, ...this.userDayStores].find(({ id }) => id === dayId)
    }

    addToUserDayStores = (day: DayStore) => {
        this.userDayStores.push(day)
    }

    isDraftId = (dayId: string) => {
        return dayId === DRAFT_ID
    }

    currentDayId = this.draftDayStore.id

    // findDayCategory = (dayStore: DayStore, categoryId: string) => {
    //     return dayStore.categories.find(({ id }) => id === categoryId)
    // }

    setCurrentDayId = (id: string) => {
        this.currentDayId = id
    }

    // saveDay = async (payload: CreateDayPayload) => {
    //     if (this.currentDayId === DRAFT_ID) {
    //         this.createDay(payload)
    //         return
    //     }
    //     this.updateDay(payload)
    // }

    createDay = async (payload: CreateDayPayload) => {
        fetchCreateDay(payload).then(res => {
            if (!res) return
            console.log(res)
            const { categories, id, name } = res.result
            const newStore = new DayStore(this)
            newStore.categories = categories
            newStore.name = name
            newStore.id = id
            this.addToUserDayStores(newStore)
            this.setCurrentDayId(id)
            this.draftDayStore.clear()

        })
    }

    updateDay = async (dayId: string, payload: CreateDayPayload) => {
        console.log(dayId)
        fetchUpdateDay(dayId, payload).then(res => {
            if (!res) return
            console.log(res)
            const { categories, id, name } = res.result


        })
    }


    removeDay = async (dayId: string) => {
        fetchDeleteDay(dayId).then(res => {
            if (!res && !res.result) return
            this.userDayStores = this.userDayStores.filter(({ id }) => id !== dayId)
        })
    }


    getDays = async () => {
        fetchGetAllDay().then(res => {
            if (!res) return
            const days = res.result.map(day => {
                const store = new DayStore(this)
                store.categories = day.categories
                store.id = day.id
                store.name = day.name
                console.log("store",store)
                return store
            })
            this.userDayStores = [...days]
        })
    }




}

export const DRAFT_ID = 'DRAFT_ID'

export class DayStore {
    constructor(rootDayStore: RootDayStore) {
        makeAutoObservable(this)
        this.rootDayStore = rootDayStore
    }

    rootDayStore: RootDayStore | null = null

    name: string = draftDayExample.dayName

    categories: DayCategory[] = JSON.parse(JSON.stringify(draftDayExample.dayContent))

    id = DRAFT_ID

    currentCategoryId: string = ''

    setCurrentCategoryId = (categoryId: string) => {
        this.currentCategoryId = categoryId
    }

    removeCategory = (categoryId: string) => {
        this.categories = this.categories.filter(({ id }) => id !== categoryId)
    }

    getCategoryById = (categoryId: string) => {
        return this.categories.find(({ id }) => id === categoryId)
    }

    syncPositions() {
        this.categories = this.categories.map((category, index) => ({
            ...category,
            position: index, // Update the position to match the index
        }));
    }

    reorderCategories(startIndex: number, endIndex: number) {
        if (startIndex === endIndex) return;

        const updatedCategories = [...this.categories];
        const [movedItem] = updatedCategories.splice(startIndex, 1); // Remove the dragged item
        updatedCategories.splice(endIndex, 0, movedItem); // Insert at the target index

        this.categories = updatedCategories;
        this.syncPositions(); // Update positions to reflect the new order
    }


    addCategory = () => {
        this.categories.push({
            id: uuidv4(),
            position: 0,
            name: 'Новая категория',
            dishes: []
        })
    }


    addDishToCategory = (categoryId: string, dish: DayCategoryDish) => {
        console.log(categoryId)
        const category = this.categories.find(({ id }) => id === categoryId)
        console.log(category)
        if (!category) return
        const dishExist = category.dishes.find(({ id }) => id === dish.id)
        if (dishExist) return
        category.dishes.push(dish)
        console.log('this.categories', toJS(this.categories))
    }


    isDishInCategory = (category: DayCategory, dishId: string): boolean => {
        return category?.dishes.some(({ id }) => id === dishId)
    }

    updateCategoryPositions(fromIndex: number, toIndex: number) {
        const updatedCategories = [...this.categories];
        const [movedItem] = updatedCategories.splice(fromIndex, 1);
        updatedCategories.splice(toIndex, 0, movedItem);

        // Update positions of all categories based on their new order
        updatedCategories.forEach((category, index) => {
            category.position = index;  // Update position according to new index
        });

        this.categories = updatedCategories;
    }

    generatePayload = (): CreateDayPayload => {
        const payload = {
            name: this.name,
            categories: this.categories.map(({ dishes, name, position }) => ({
                dishes: dishes.map(dish => {
                    const { name, ...rest } = dish
                    return {
                        ...rest
                    }
                }), name, position
            }))
        }
        console.log(payload)

        return payload
    }

    clear = () => {
        this.name = draftDayExample.dayName

        this.categories = JSON.parse(JSON.stringify(draftDayExample.dayContent))

        this.id = DRAFT_ID

        this.currentCategoryId = ''
    }

    onSave = async () => {
        if (this.id === DRAFT_ID) {
            this.rootDayStore?.createDay(this.generatePayload())
            return
        }
        this.rootDayStore?.updateDay(this.id, this.generatePayload())
    }
}



type DayCategoryDish = {
    "id": string,
    "name": string,
    "position": number
}

export type DayCategory = {
    "id": string,
    "name": string,
    position: number,
    "dishes": DayCategoryDish[]
}

type Day =
    {
        "dayName": string,
        "dayContent":
        DayCategory[]
    }

const draftDayExample = {
    dayName: 'Новый день',
    dayContent: [
        {
            id: uuidv4(),
            name: 'Завтрак',
            dishes: [],
            position: 1
        },
        {
            id: uuidv4(),
            name: 'Обед',
            dishes: [],
            position: 2
        },
        {
            id: uuidv4(),
            name: 'Ужин',
            dishes: [],
            position: 3
        },
    ]
}