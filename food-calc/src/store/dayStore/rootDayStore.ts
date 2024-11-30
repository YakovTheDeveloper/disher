import { fetchCreateDay, fetchDeleteDay, fetchGetAllDay, fetchUpdateDay } from "@/api/day";
import { isEmpty, isNotEmpty } from "@/lib/empty";
import { CalculationStore } from "@/store/calculationStore/calculationStore";
import { DetectChangesStore } from "@/store/common/DetectChangesStore";
import { DraftStore, UserDataStore } from "@/store/common/types";
import { RootDishStore } from "@/store/rootMenuStore/rootMenuStore";
import { rootDishStore } from "@/store/rootStore";
import { CreateDayPayload } from "@/types/api/day";
import { action, autorun, computed, makeAutoObservable, makeObservable, observable, reaction, runInAction, toJS } from "mobx"
import { v4 as uuidv4 } from 'uuid';




export class RootDayStore {
    currentAbortController: AbortController | null = null;

    constructor(private rootMenuStore: RootDishStore) {
        makeAutoObservable(this)

        autorun(() => {

            this.getDays()
        })


        reaction(
            () => rootDishStore.dishIds,
            (totalDishIds) => {

                this.allStores.forEach(store => {
                    const dayDishIds = store.dishIds
                    const deletedDishIds = dayDishIds.filter((id) => !totalDishIds.includes(+id));

                    if (isEmpty(deletedDishIds)) return

                    deletedDishIds.forEach((deletedDishId) => {
                        store.categories.forEach((category) => {
                            const dish = category.dishes.find((d) => d.id === deletedDishId);
                            if (!dish) return
                            store.removeDishFromCategory(category.id, dish);
                        });
                        if (store instanceof UserDayStore) {
                            store.detectChangesStore.updateSnapshot(store.categories)
                        }
                    });


                    console.log("Deleted dish IDs:", deletedDishIds);
                })
            }
        );


        reaction(
            () => [this.currentStore, this.currentStore?.categories.map(cat => toJS(cat.dishes))],
            ([day]) => {
                runInAction(() => {
                    if (!day) return

                    if (this.currentAbortController) {
                        this.currentAbortController.abort();
                    }
                    this.currentAbortController = new AbortController();
                    this.calculations.resetNutrients()
                    const dishesProductIds = this.rootMenuStore.getCorrespondingDishesProductsIds(day?.dishes || [])
                    const productsToFetch = this.calculations.productStore.getMissingProductIds(dishesProductIds)
                    const dishes = this.rootMenuStore.getCorrespondingDishes(day?.dishes || [])

                    if (isNotEmpty(productsToFetch)) {
                        const currentController = this.currentAbortController
                        this.calculations.productStore.fetchAndSetProductNutrientsData(productsToFetch, this.currentAbortController.signal)
                            .then(res => {
                                if (!res) return
                                if (currentController !== this.currentAbortController) return;
                                this.calculations.update(dishes)
                            })

                    }
                    if (isEmpty(productsToFetch)) {
                        this.calculations.update(dishes)
                    }
                })
            }
        );
    }


    calculations = new CalculationStore()

    draftDayStore: DayStore = new DraftDayStore(this)
    userDayStores: UserDayStore[] = []

    get allStores() {
        return [this.draftDayStore, ...this.userDayStores]
    }

    get currentStore() {
        return this.allStores.find(({ id }) => id === this.currentDayId)
    }

    get currentDayProducts() {
        return this.currentStore?.products
    }

    findDayStore = (dayId: string) => {
        return [this.draftDayStore, ...this.userDayStores].find(({ id }) => id === +dayId)
    }

    addToUserDayStores = (day: UserDayStore) => {
        this.userDayStores.push(day)
    }

    isDraftId = (dayId: number) => {
        return dayId === DRAFT_ID
    }

    currentDayId = this.draftDayStore.id

    setCurrentDayId = (id: number) => {
        this.currentDayId = id
    }


    addDay = async (payload: CreateDayPayload) => {
        fetchCreateDay(payload).then(res => {
            if (!res) return
            const { categories, id, name } = res.result
            const newStore = new UserDayStore(this)
            newStore.categories = categories
            newStore.name = name
            newStore.id = id
            newStore.detectChangesStore.setInitSnapshot(categories)
            this.addToUserDayStores(newStore)
            this.setCurrentDayId(id)
            this.draftDayStore.clear()

        })
    }

    updateDay = async (dayId: number, payload: CreateDayPayload) => {
        fetchUpdateDay(dayId, payload).then(res => {
            if (!res) return
            console.log(res)
            // const { categories, id, name } = res.result


        })
    }


    removeDay = async (dayId: number) => {
        fetchDeleteDay(dayId).then(res => {
            if (!res && !res.result) return
            this.userDayStores = this.userDayStores.filter(({ id }) => +id !== dayId)
        })
    }


    getDays = async () => {
        fetchGetAllDay().then(res => {
            if (!res) return
            const days = res.result.map(day => {
                const store = new UserDayStore(this)
                const categories = day.categories.sort((a, b) => a.position - b.position);
                store.categories = categories
                store.id = day.id
                store.name = day.name
                store.detectChangesStore.setInitSnapshot(categories)
                console.log("store", store)
                return store
            })
            this.userDayStores = [...days]
        })
    }





}

export const DRAFT_ID = -1
export const DRAFT_NAME = 'Новый день'

export class DayStore {
    constructor(rootDayStore: RootDayStore) {
        makeObservable(this, {
            rootDayStore: observable,
            name: observable,
            categories: observable,
            id: observable,
            currentCategoryId: observable,
            empty: computed,
            dishes: computed,
            dishIds: computed,
            products: computed,
            uniqueProducts: computed,

        })
        this.rootDayStore = rootDayStore

        // reaction(
        //     () => rootDishStore.dishIds,
        //     (totalDishIds) => {
        //         const dayDishIds = this.dishIds
        //         const deletedDishIds = dayDishIds.filter((id) => !totalDishIds.includes(id));

        //         if (isNotEmpty(deletedDishIds)) {
        //             deletedDishIds.forEach((deletedDishId) => {
        //                 this.categories.forEach((category) => {
        //                     const dish = category.dishes.find((d) => d.id === deletedDishId);
        //                     if (dish) {
        //                         this.removeDishFromCategory(category.id, dish);
        //                     }
        //                 });
        //             });
        //         }

        //         console.log("Deleted dish IDs:", deletedDishIds);
        //     }
        // );

    }



    rootDayStore: RootDayStore | null = null

    name: string = draftDayExample.dayName

    categories: DayCategory[] = JSON.parse(JSON.stringify(draftDayExample.dayContent))

    id = DRAFT_ID

    currentCategoryId: string = ''

    get empty() {
        return this.categories.length === 0
    }

    get dishes() {
        return this.categories.flatMap(cat => cat.dishes.map(({ id }) => id))
    }

    get dishIds() {
        return this.categories.flatMap(cat => cat.dishes.map(({ id }) => id))
    }

    get products() {
        const products: string[] = []
        for (const category of this.categories) {
            for (const dish of category.dishes) {
                products.push(dish.id)
            }
        }
        return Array.from(new Set(products))
    }

    get uniqueProducts() {
        const products: string[] = []
        for (const category of this.categories) {
            for (const dish of category.dishes) {
                products.push(dish.id)
            }
        }
        return Array.from(new Set(products))
    }

    updateName = (name: string) => {
        this.name = name
    }

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

    removeDishFromCategory = (categoryId: string, dish: DayCategoryDish) => {
        const category = this.categories.find(({ id }) => id === categoryId)
        if (!category) return
        category.dishes = category?.dishes.filter(({ id }) => id !== dish.id)
    }

    changeCategoryName = (categoryId: string, name: string) => {
        const category = this.categories.find(({ id }) => id === categoryId)
        if (!category) return
        category.name = name

    }

    toggleDish = (categoryId: string, dish: DayCategoryDish) => {
        const category = this.categories.find(({ id }) => id === categoryId)
        if (!category) return
        const dishExist = category.dishes.find(({ id }) => id === dish.id)
        if (dishExist) {
            category.dishes = category?.dishes.filter(({ id }) => id !== dish.id)
            return
        }
        category.dishes.push(dish)
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

    save = async () => {
        if (this.id === DRAFT_ID) {
            this.rootDayStore?.addDay(this.generatePayload())
            return
        }
        this.rootDayStore?.updateDay(this.id, this.generatePayload())
    }

    resetToInit = () => {
        this.categories = structuredClone(draftDayExample.dayContent)
        this.name = DRAFT_NAME
        this.id = DRAFT_ID
    }


}

export class UserDayStore extends DayStore implements UserDataStore<DayCategory[]> {

    constructor(rootDayStore: RootDayStore) {
        super(rootDayStore)
        makeObservable(this, {
            save: action,
            resetToInit: action,
        })
        this.detectChangesStore = new DetectChangesStore(this.categories);

        reaction(
            () => [toJS(this.categories)],
            ([data]) => {
                this.detectChangesStore.setData(data)
            }
        );

    }
    detectChangesStore: DetectChangesStore<DayCategory[]>


    remove = (id: number) => {
        return this.rootDayStore?.removeDay(id)
    }

    resetToInit = () => {
        console.log('from userdatstore')
        if (!this.detectChangesStore.initProductsSnapshotCopy) return
        this.categories = this.detectChangesStore.initProductsSnapshotCopy
    }

    save = async (id: number) => {
        return this.rootDayStore?.updateDay(this.id, this.generatePayload())
            .then(() => {
                this.detectChangesStore.updateSnapshot(this.categories)
            })
    }


}

export class DraftDayStore extends DayStore implements DraftStore {
    constructor(rootDayStore: RootDayStore) {
        super(rootDayStore)
        makeObservable(this, {
            save: action,
            resetToInit: action,
        })
    }

    save = async () => {
        this.rootDayStore?.addDay(this.generatePayload())
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