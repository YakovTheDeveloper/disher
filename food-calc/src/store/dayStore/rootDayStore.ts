import { makeAutoObservable, toJS } from "mobx"
import { v4 as uuidv4 } from 'uuid';




export class RootDayStore {
    constructor() {
        makeAutoObservable(this)
    }

    draftDayStore: DayStore = new DayStore()
    userDayStores: DayStore[] = []

    findDayStore = (dayId: string) => {
        return [this.draftDayStore, ...this.userDayStores].find(({ id }) => id === dayId)
    }

    // findDayCategory = (dayStore: DayStore, categoryId: string) => {
    //     return dayStore.categories.find(({ id }) => id === categoryId)
    // }


}

const DRAFT_ID = 'DRAFT_ID'

export class DayStore {
    constructor() {
        makeAutoObservable(this)
    }


    name: string = draftDayExample.dayName

    categories: DayCategory[] = draftDayExample.dayContent

    id = DRAFT_ID

    currentCategoryId: string = ''

    setCurrentCategoryId = (categoryId: string) => {
        this.currentCategoryId = categoryId
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

    // addDishToCategory = (categoryId: string, dishId: string) => {
    //     const category = this.categories.find(({ id }) => id === categoryId)
    //     console.log(this.categories)
    //     if (!category) return
    //     category.dishes.push({
    //         id: dishId,
    //         position: 0
    //     })
    // }


    // addDishToCategory = (category: DayCategory, dish: DayCategoryDish) => {
    //     category.dishes.push(dish)
    // }

    addDishToCategory = (categoryId: string, dish: DayCategoryDish) => {
        console.log(categoryId)
        const category = this.categories.find(({ id }) => id === categoryId)
        console.log(category)
        if (!category) return
        const dishExist = category.dishes.find(({ id }) => id === dish.id)
        if (dishExist) return
        category.dishes.push(dish)
        console.log('this.categories',toJS(this.categories))
    }


    isDishInCategory = (category: DayCategory, dishId: string): boolean => {
        return category?.dishes.some(({ id }) => id === dishId)
    }

    moveCategory = (fromIndex: number, toIndex: number) => {
        const updatedCategories = [...this.categories];
        const [movedCategory] = updatedCategories.splice(fromIndex, 1);
        updatedCategories.splice(toIndex, 0, movedCategory);
        this.categories = updatedCategories;
    };

    // Function to remove category from the list (when dropped to a new location)
    removeCategory = (index: number) => {
        const updatedCategories = [...this.categories];
        updatedCategories.splice(index, 1);
        this.categories = updatedCategories;
    };

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

    generatePayload = () => {

        return {
            dayName: this.name,
            dayContent: this.categories
        }
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