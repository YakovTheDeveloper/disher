import { LoadingStateStore } from "@/store/common/LoadingStateStore";
import { createDraftDayCategory, DayCategoryStore } from "@/store/rootDayStore/dayCategoryStore/dayCategoryStore";
import { DaysFetchManager } from "@/store/rootDayStore/daysFetchManager";
import { DayStore2, DraftDayStore2, UserDayStore2 } from "@/store/rootDayStore/dayStore2";
import { Response } from "@/types/api/common";
import { CreateDayPayload } from "@/types/api/day";
import { Day } from "@/types/day/day";
import { IProductBase } from "@/types/dish/dish";
import { autorun, makeAutoObservable } from "mobx"

export class RootDayStore2 {
    currentAbortController: AbortController | null = null;

    constructor() {
        makeAutoObservable(this)
        autorun(() => {
            this.getDays()
            this.draftDayStore.categories = [
                new DayCategoryStore(this.draftDayStore, createDraftDayCategory({ name: 'Завтрак', position: 0 })),
                new DayCategoryStore(this.draftDayStore, createDraftDayCategory({ name: 'Обед', position: 1 })),
                new DayCategoryStore(this.draftDayStore, createDraftDayCategory({ name: 'Ужин', position: 2 })),
            ]
        })
    }

    loadingState = new LoadingStateStore()
    fetchManager = new DaysFetchManager(this.loadingState)

    draftDayStore: DayStore2 = new DraftDayStore2()
    userDayStores: UserDayStore2[] = []

    get allStores() {
        return [this.draftDayStore, ...this.userDayStores]
    }

    get currentStore() {
        return this.allStores.find(({ id }) => id === this.currentDayId)
    }

    findDayStore = (dayId: number) => {
        return [this.draftDayStore, ...this.userDayStores].find(({ id }) => id === dayId)
    }

    addToUserDayStores = (day: UserDayStore2) => {
        this.userDayStores.push(day)
    }

    isDraftId = (dayId: number) => {
        return dayId === this.draftDayStore.id
    }

    currentDayId = this.draftDayStore.id

    setCurrentDayId = (id: number) => {
        this.currentDayId = id
    }

    addDay = async (payload: CreateDayPayload): Promise<Response<Day>> => {
        return this.fetchManager.create(payload).then(res => {
            if (res.isError) {
                return res
            }
            const { data } = res
            const newStore = new UserDayStore2(data)
            this.addToUserDayStores(newStore)
            this.setCurrentDayId(data.id)
            return res
            // this.draftDayStore.clear()

        })
    }

    updateDay = async (dayId: number, payload: CreateDayPayload) => {
        return this.fetchManager.update(dayId, payload).then(res => res)
    }


    removeDay = async (dayId: number) => {
        return this.fetchManager.delete(dayId).then(res => {
            return res
        })
    }

    removeLocal = (dayId: number) => {
        const index = this.userDayStores.findIndex(({ id }) => +id === dayId);
        if (index === -1) return null;

        const [day] = this.userDayStores.splice(index, 1);

        return { day, index };
    };

    addLocal = ({ day, index }: { day: UserDayStore2, index?: number }) => {
        if (index == null) {
            this.userDayStores.push(day)
            return
        }
        this.userDayStores.splice(index, 0, day);
    };

    getDays = async () => {
        return this.fetchManager.getAll().then(result => {
            // console.log("result",result)
            if (result.isError) {
                return result
            }
            const days = result.data.map(day => {
                const store = new UserDayStore2(day)
                // store.detectChangesStore.setInitSnapshot(store.toJS())
                return store
            })
            this.userDayStores = [...days]
            return result
        })
    }

    updateDishInDays = (dishId: number, name: string, products: IProductBase[]) => {
        this.allStores.forEach(({ categories }) => {
            categories.forEach(({ dishes }) => {
                dishes.forEach((dish) => {
                    if (dish.id === dishId) {
                        dish.update(name, products)
                    }
                })
            })
        })
    }

    removeDishFromDays = (dishId: number) => {
        this.allStores.forEach(({ categories }) => {
            categories.forEach(({ removeDish }) => removeDish(dishId))
        })
    }


}

export const DRAFT_ID = -1
export const DRAFT_NAME = 'Новый рацион'

