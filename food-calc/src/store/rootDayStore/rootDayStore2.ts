import { fetchCreateDay, fetchDeleteDay, fetchGetAllDay, fetchUpdateDay } from "@/api/day";
import { isEmpty, isNotEmpty } from "@/lib/empty";
import { CalculationStore } from "@/store/calculationStore/calculationStore";
import { createDraftDayCategory, DayCategoryStore } from "@/store/rootDayStore/dayCategoryStore/dayCategoryStore";
import { DaysFetchManager } from "@/store/rootDayStore/daysFetchManager";
import { DayStore, DraftDayStore, UserDayStore } from "@/store/rootDayStore/dayStore";
import { DayStore2, DraftDayStore2, UserDayStore2 } from "@/store/rootDayStore/dayStore2";
import { RootDishStore } from "@/store/rootDishStore/rootDishStore";
import { rootDishStore } from "@/store/rootStore";
import { Response } from "@/types/api/common";
import { CreateDayPayload } from "@/types/api/day";
import { Day } from "@/types/day/day";
import { GenerateId } from "@/utils/uuidNumber";
import { autorun, makeAutoObservable, reaction, runInAction, toJS } from "mobx"

import { v4 as uuidv4 } from 'uuid';



export class RootDayStore2 {
    currentAbortController: AbortController | null = null;

    constructor() {
        makeAutoObservable(this)
        autorun(() => {
            this.getDays()
            this.draftDayStore.categories = [
                new DayCategoryStore(this.draftDayStore, createDraftDayCategory({ name: 'Завтрак' })),
                new DayCategoryStore(this.draftDayStore, createDraftDayCategory({ name: 'Обед' })),
                new DayCategoryStore(this.draftDayStore, createDraftDayCategory({ name: 'Ужин' })),
            ]
        })
    }

    fetchManager = new DaysFetchManager()

    calculations = new CalculationStore()

    draftDayStore: DayStore2 = new DraftDayStore2(this)
    userDayStores: DayStore2[] = []

    get allStores() {
        return [this.draftDayStore, ...this.userDayStores]
    }

    get currentStore() {
        return this.allStores.find(({ id }) => id === this.currentDayId)
    }

    findDayStore = (dayId: number) => {
        return [this.draftDayStore, ...this.userDayStores].find(({ id }) => id === dayId)
    }

    addToUserDayStores = (day: DayStore2) => {
        this.userDayStores.push(day)
    }

    isDraftId = (dayId: number) => {
        return dayId === DRAFT_ID
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
            const newStore = new UserDayStore2(this, data)
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
            if (res.isError) {
                return res
            }
            this.userDayStores = this.userDayStores.filter(({ id }) => +id !== dayId)
            return res
        })
    }

    getDays = async () => {
        return this.fetchManager.getAll().then(result => {
            // console.log("result",result)
            if (result.isError) {
                return result
            }
            const days = result.data.map(day => {
                const store = new UserDayStore2(this, day)
                store.detectChangesStore.setInitSnapshot(store.toJS())
                return store
            })
            this.userDayStores = [...days]
            return result
        })
    }




}

export const DRAFT_ID = -1
export const DRAFT_NAME = 'Новый день'

