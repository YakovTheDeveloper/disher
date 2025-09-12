import { makeAutoObservable } from "mobx";

export class OptionsStoreUI {
    constructor() {
        makeAutoObservable(this);
    }

    showAdditionals: boolean = false

    private setShowAdditionals = (value: boolean) => {
        this.showAdditionals = value
    }

    toggle = () => {
        this.showAdditionals = !this.showAdditionals
    }
}
