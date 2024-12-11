import { DetectChangesStore } from "@/store/common/DetectChangesStore";
import { DraftStore, UserDataStore } from "@/store/common/types";
import { createDraftDayCategory, DayCategoryStore } from "@/store/rootDayStore/dayCategoryStore/dayCategoryStore";
import { DaysFetchManager } from "@/store/rootDayStore/daysFetchManager";
import { RootDayStore } from "@/store/rootDayStore/rootDayStore";
import { RootDayStore2 } from "@/store/rootDayStore/rootDayStore2";
import { CreateDayPayload } from "@/types/api/day";
import { Day, DayCategory } from "@/types/day/day";
import { GenerateId } from "@/utils/uuidNumber";
import { action, computed, makeAutoObservable, makeObservable, observable, observe, reaction, runInAction, toJS } from "mobx";
import { v4 as uuidv4 } from 'uuid';

export abstract class DayStore2 {
    constructor(private rootStore: RootDayStore2, day: Day) {
        this.init(day)
        makeObservable(this, {
            id: observable,
            name: observable,
            date: observable,
            categories: observable,
            currentCategoryId: observable,
            currentCategory: computed,
            init: action,
            createNewCategory: action,
            removeCategory: action,
            syncPositions: action,
            reorderCategories: action,
            reorderCategories2: action,
            setCurrentCategoryId: action,
            updateName: action,
            updateDate: action,
            // setCurrentCategoryByIndex: action,
            uniqueProductIds: computed,
            calcReactionPayload: computed
        })
    }

    id: number = GenerateId();

    name = 'Новый день'

    date = ''

    categories: DayCategoryStore[] = []

    // currentCategory: DayCategoryStore | null = null

    get currentCategory() {
        return this.categories.find(({ id }) => id === this.currentCategoryId) || null
    }

    currentCategoryId: number = -1

    setCurrentCategoryId = (id: number) => this.currentCategoryId = id

    init = (day: Day) => {
        const { date, id, name, categories } = day
        this.categories = categories
            .sort((a, b) => a.position - b.position)
            .map(category => new DayCategoryStore(this, category))
        this.id = id
        this.name = name
        this.date = date
    }


    createNewCategory = (data?: Partial<DayCategory>) => {
        const result: DayCategory = createDraftDayCategory(data)
        const category = new DayCategoryStore(this, result)
        this.categories.push(category)
        console.log(toJS(this.categories))
    }

    // setCurrentCategory = (category: DayCategoryStore | null) => {
    //     this.currentCategory = category
    // }

    // setCurrentCategoryByIndex = (idx: number) => {
    //     if (idx >= 0 && idx < this.categories.length) {
    //         this.currentCategory = this.categories[idx];
    //         this.current
    //     } else {
    //         this.currentCategory = null;
    //     }
    // };

    removeCategory = (categoryId: number) => {

        const index = this.categories.findIndex(({ id }) => id === categoryId);

        if (index !== -1) {
            this.categories.splice(index, 1);
            const nextCategoryId = this.categories[index - 1]?.id
            nextCategoryId != null && this.setCurrentCategoryId(nextCategoryId)
        }
    }

    syncPositions() {
        this.categories.forEach((category, index) => {
            category.position = index; // Assuming `position` is a public property
        });
    }

    reorderCategories(newOrder: DayCategoryStore[]) {
        this.categories = newOrder

        this.syncPositions();
    }


    reorderCategories2 = (newOrder: DayCategoryStore[]) => {
        this.categories = newOrder
    }
    // reorderCategories(startIndex: number, endIndex: number) {
    //     if (startIndex === endIndex) return;

    //     const updatedCategories = [...this.categories];
    //     const [movedItem] = updatedCategories.splice(startIndex, 1); // Remove the dragged item
    //     updatedCategories.splice(endIndex, 0, movedItem); // Insert at the target index

    //     this.categories = updatedCategories;
    //     this.syncPositions(); // Update positions to reflect the new order
    // }

    updateName = (name: string) => this.name = name
    updateDate = (date: string) => this.date = date

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

    get uniqueProductIds() {
        return [...new Set(this.categories.flatMap(category => {
            return category.dishes.flatMap(dish => dish.productIds)
        }))]
    }

    get calcReactionPayload() {
        return this.categories.map(category => ({
            dishes: category.dishes.map(({ coefficient, products }) => ({
                coefficient,
                products: products.map(product => ({ ...product }))
            }))
        }));
    }

    // update = (day: Day) => {
    //     day.categories.forEach(updatedCategory => {
    //         this.categories.forEach(category => {
    //             if (updatedCategory.id !== category.id) return
    //             category.name = updatedCategory.name
    //             category.position = updatedCategory.position

    //             category.dishes.forEach(dish => {
    //                 dish.coefficient = updatedCategory.
    //             })
    //         })
    //     })
    // }
}

type DayData = Day
// type DayData = {
//     date: string;
//     categories: {
//         id: number,
//         name: string;
//         position: number;
//         dishes: {
//             name: string;
//         }[];
//     }[];
// }

export class UserDayStore2 extends DayStore2 implements UserDataStore<DayData> {


    constructor(private rootDayStore: RootDayStore2, day: Day) {
        super(rootDayStore, day)
        makeObservable(this, {
            save: action,
            resetToInit: action,
        })

        this.detectChangesStore = new DetectChangesStore(this.toJS(), 'day');


        reaction(
            () => [this.toJS()],
            ([data]) => {
                console.log("NEWDATA", data)
                this.detectChangesStore.setData(data)
            }
        );
    }

    toJS(): DayData {
        return {
            id: this.id,
            name: this.name,
            date: this.date,
            categories: this.categories.map((category) => ({
                id: category.id,
                name: category.name,
                position: category.position,
                dishes: category.dishes.map(({ id, coefficient, products, name }) => ({
                    name,
                    id,
                    coefficient,
                    products: products.map(product => ({
                        id: product.id,
                        quantity: product.quantity
                    }))
                })),
            })),
        };
    }

    detectChangesStore: DetectChangesStore<DayData>


    remove = (id: number) => {
        return this.rootDayStore?.removeDay(id)
    }

    resetToInit = () => {
        console.log('from userdatstore')
        if (!this.detectChangesStore.initProductsSnapshotCopy) return
        const day = this.detectChangesStore.initProductsSnapshotCopy
        this.setCurrentCategory(null)
        this.init(day)

        // day.categories.forEach(snapshotCategory => {
        //     this.categories.forEach(category => {
        //         if (snapshotCategory.id !== category.id) return

        //     })
        // })

    }

    save = async () => {
        return this.rootDayStore?.updateDay(this.id, this.generatePayload())
            .then((res) => {
                this.detectChangesStore.updateSnapshot(this.toJS())
                return res
            })
    }

    // get loading() {
    //     const state = this.rootDayStore.fetchManager.loading;
    //     return state.update.get(+this.id) || state.delete.get(+this.id) || false;
    // }

}

export class DraftDayStore2 extends DayStore2 implements DraftStore {
    constructor(private rootDayStore: RootDayStore2) {
        super(rootDayStore, createDraftDay())
        makeObservable(this, {
            save: action,
            resetToInit: action,
        })
    }

    resetToInit = () => {
        const day = createDraftDay()
        this.init(day)
        this.setCurrentCategory(null)
        this.rootDayStore.setCurrentDayId(day.id)
    }

    // get loading() {
    //     return this.rootDayStore.fetchManager.loading.save;
    // }

    save = async () => {
        return this.rootDayStore?.addDay(this.generatePayload())
    }
}

const createDraftDay = (): Day => ({
    categories: [
        { name: 'Завтрак', id: GenerateId(), dishes: [], position: 0 },
        { name: 'Обед', id: GenerateId(), dishes: [], position: 1 },
        { name: 'Ужин', id: GenerateId(), dishes: [], position: 2 },
    ],
    date: '',
    id: GenerateId(),
    name: 'Новый день'
})