import { makeAutoObservable } from "mobx";
export type CommonModals =
    | 'food'
    | 'quantity'
    | 'nutrients'
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
