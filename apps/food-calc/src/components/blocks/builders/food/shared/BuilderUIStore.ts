import { makeAutoObservable } from "mobx";

export class BuilderUIStore {
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

    currentPage = 1

    setCurrentPage = (value: number) => {
        this.currentPage = value
    }
}
