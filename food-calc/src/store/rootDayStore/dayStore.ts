import { DetectChangesStore } from "@/store/common/DetectChangesStore"
import { UserDataStore, DraftStore } from "@/store/common/types"
import { DayCategoryStore } from "@/store/rootDayStore/dayCategoryStore/dayCategoryStore"
import { RootDayStore, DRAFT_ID, DRAFT_NAME } from "@/store/rootDayStore/rootDayStore"
import { CreateDayPayload } from "@/types/api/day"
import { DayCategory, DayCategoryDish } from "@/types/day/day"
import { makeObservable, observable, computed, toJS, action, reaction } from "mobx"
import { v4 as uuidv4 } from 'uuid';

type DayData = {
    date: string,
    categories: DayCategory[]
}

export class DayStore {
    constructor(rootDayStore: RootDayStore) {
        makeObservable(this, {
            rootDayStore: observable,
            name: observable,
            categories: observable,
            id: observable,
            date: observable,
            currentCategoryId: observable,
            empty: computed,
            dishIds: computed,
            products: computed,
            data: computed,
            uniqueProductIds: computed,
            currentCategory: computed,
            setDate: action,
            setCurrentCategoryId: action,


            categories2: observable,
            setCategories: action
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


    setCategories = (categories: DayCategory[]) => {
        this.categories2 = categories.map(category => new DayCategoryStore(category))
    }

    categories2: DayCategoryStore[] = []



    rootDayStore: RootDayStore | null = null

    name: string = draftDayExample.dayName

    categories: DayCategory[] = JSON.parse(JSON.stringify(draftDayExample.dayContent))

    id = DRAFT_ID

    currentCategoryId: string = ''

    date = ''

    get empty() {
        return this.categories.length === 0
    }

    get map() {
        return this.categories.reduce((categoryMap, category) => {
            const dishesMap = category.dishes.reduce((dishesMap, dish) => {
                dishesMap[+dish.id] = dish;
                return dishesMap;
            }, {} as Record<number, DayCategoryDish>);

            categoryMap[category.id] = {
                ...category,
                dishes: dishesMap,
            };

            return categoryMap;
        }, {} as Record<number, { id: number; name: string; position: number; dishes: Record<number, DayCategoryDish> }>);
    }


    get dishesMap() {
        return this.categories.reduce((acc, cat) => {
            acc[+cat.id] = cat
            return acc
        }, {} as Record<number, DayCategory>)
    }

    get dishIds() {
        return this.categories.flatMap(cat => cat.dishes.map(({ id }) => id))
    }

    get products() {
        return this.categories.flatMap(category => category.dishes).flatMap(dishes => dishes.products)
    }

    get uniqueProductIds() {
        let products: number[] = []
        for (const category of this.categories) {
            for (const dish of category.dishes) {
                const productIds = dish.products.flatMap(({ id }) => id)
                products = [...products, ...productIds]
            }
        }
        return Array.from(new Set(products))
    }

    get currentCategory() {
        return this.categories.find(({ id }) => id === this.currentCategoryId)
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
        return category?.dishes.some(({ id }) => id === +dishId)
    }

    updateDishCoefficient = (categoryId: number, dishId: number, value: number) => {
        console.log(categoryId, dishId)
        const category = this.map[categoryId]
        console.log(toJS(this.categories))
        const dish = category?.dishes?.[dishId]
        if (!dish) return
        dish.coefficient = +value.toFixed(1)
    }

    getDishCoefficient = (categoryId: number, dishId: number): number => {
        const category = this.map[categoryId]
        const dish = category?.dishes?.[dishId]
        return dish?.coefficient || 0
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
        const payload: CreateDayPayload = {
            name: this.name,
            date: this.date,
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

    setDate = (date: string) => this.date = date

    get data() {
        return {
            date: this.date,
            categories: this.categories
        }
    }

}

export class UserDayStore extends DayStore implements UserDataStore<DayData> {

    constructor(rootDayStore: RootDayStore) {
        super(rootDayStore)
        makeObservable(this, {
            save: action,
            resetToInit: action,
        })
        this.detectChangesStore = new DetectChangesStore(this.data);

        reaction(
            () => [this.data],
            ([data]) => {
                console.log("NEWDATA", data)
                this.detectChangesStore.setData(data)
            }
        );
        // reaction(
        //     () => [toJS(this.categories)],
        //     ([data]) => {
        //         this.detectChangesStore.setData(data)
        //     }
        // );

    }
    detectChangesStore: DetectChangesStore<DayData>


    remove = (id: number) => {
        return this.rootDayStore?.removeDay(id)
    }

    resetToInit = () => {
        console.log('from userdatstore')
        if (!this.detectChangesStore.initProductsSnapshotCopy) return
        const { categories, date } = this.detectChangesStore.initProductsSnapshotCopy
        this.date = date
        this.categories = categories
        // this.categories = this.detectChangesStore.initProductsSnapshotCopy
    }

    save = async (id: number) => {
        return this.rootDayStore?.updateDay(this.id, this.generatePayload())
            .then(() => {
                this.detectChangesStore.updateSnapshot(this.data)
                // this.detectChangesStore.updateSnapshot(this.categories)
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

    // get loading() {
    //     return this.rootStore.fetchManager.loading.save;
    //   }

    save = async () => {
        this.rootDayStore?.addDay(this.generatePayload())
    }
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