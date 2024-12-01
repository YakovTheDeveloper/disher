import { fetchCreateDay, fetchDeleteDay, fetchGetAllDay, fetchUpdateDay } from "@/api/day";
import { isEmpty, isNotEmpty } from "@/lib/empty";
import { CalculationStore } from "@/store/calculationStore/calculationStore";
import { DayStore, DraftDayStore, UserDayStore } from "@/store/rootDayStore/dayStore";
import { RootDishStore } from "@/store/rootDishStore/rootDishStore";
import { rootDishStore } from "@/store/rootStore";
import { CreateDayPayload } from "@/types/api/day";
import { autorun, makeAutoObservable, reaction, runInAction, toJS } from "mobx"




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
            ([day, _]) => {
                runInAction(() => {
                    if (!day) return
                    const dayStore = day as DayStore;

                    if (this.currentAbortController) {
                        this.currentAbortController.abort();
                    }
                    this.currentAbortController = new AbortController();
                    this.calculations.resetNutrients()

      
                    const productsToFetch = this.calculations.productStore.getMissingProductIds(dayStore.uniqueProductIds)
                    if (isNotEmpty(productsToFetch)) {
                        const currentController = this.currentAbortController
                        this.calculations.productStore.fetchAndSetProductNutrientsData(productsToFetch, this.currentAbortController.signal)
                            .then(res => {
                                if (!res) return
                                if (currentController !== this.currentAbortController) return;
                                this.calculations.updateWithDay(dayStore.categories)
                            })

                    }
                    if (isEmpty(productsToFetch)) {
                        this.calculations.updateWithDay(dayStore.categories)
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

