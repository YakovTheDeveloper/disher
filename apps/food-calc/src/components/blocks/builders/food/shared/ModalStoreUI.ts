import { makeAutoObservable } from "mobx";

export enum Suggestion {
    Time = "time",
    Food = "food",
    Quantity = "quantity"
}

export class ModalStoreUI<Variants> {
    constructor() {
        makeAutoObservable(this);
    }

    current: Variants | null = null

    set = (value: Variants | null) => {
        this.current = value
    }

    close = () => this.set(null)
}
