import { makeAutoObservable } from "mobx";

export class MenuUiStore {
    constructor() {
        makeAutoObservable(this);
    }

    isOpen = false

    open = () => this.isOpen = true
    close = () => this.isOpen = false
    toggle = () => this.isOpen = !this.isOpen

}
