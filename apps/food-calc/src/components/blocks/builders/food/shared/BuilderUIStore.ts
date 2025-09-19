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

    foodSelectMessage: string[] = []

    getFoodSelectMessage = () => {
        return this.foodSelectMessage.pop() || null
    }

    pushFoodSelectMessage = (message: string) => {
        this.foodSelectMessage.push(message)
    }

    clearFoodSelectMessage = () => this.foodSelectMessage = []

}
