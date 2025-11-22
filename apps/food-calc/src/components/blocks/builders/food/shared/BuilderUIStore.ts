import { makeAutoObservable } from "mobx";

export class BuilderUIStore {
    constructor(pages: number[]) {
        makeAutoObservable(this);
        this.pages = pages
    }

    showAdditionals: boolean = false

    pages: number[]

    pagesShowMoreOptions: Record<number, {
        showAdditionals: boolean
    }> = {
            0: {
                showAdditionals: false
            },
            1: {
                showAdditionals: false
            },
            2: {
                showAdditionals: false
            },
        }

    togglePagesShowMoreOptions = (value: number) => {
        const prevValue = this.pagesShowMoreOptions[value].showAdditionals
        this.pagesShowMoreOptions[value].showAdditionals = !prevValue
    }

    toggle = () => {
        this.showAdditionals = !this.showAdditionals
    }

    getShowMoreOptions = (value: number) => this.pagesShowMoreOptions[value]

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
