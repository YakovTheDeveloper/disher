import { makeAutoObservable } from "mobx"



export class DayStore {
    constructor() {
        makeAutoObservable(this)
    }

    dishIds = []
}