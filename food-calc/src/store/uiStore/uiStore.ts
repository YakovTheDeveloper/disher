import { makeAutoObservable } from "mobx"

export enum Modals {
    Auth = 'Auth',
    Product = 'Product',
}


export class UiStore {


    currentModal: Modals | null = null

    openModal = (id: Modals) => {
        this.currentModal = id
    }

    closeModal = () => {
        this.currentModal = null
    }

    constructor() {
        makeAutoObservable(this)
    }




}
