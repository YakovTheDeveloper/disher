import { makeAutoObservable } from "mobx";

export class BuilderUIStore {
    constructor(pages: number[]) {
        makeAutoObservable(this);
        this.pages = pages
    }

    pages: number[]

    currentPage = 1

    setCurrentPage = (value: number, total: number) => {
        this.currentPage = Math.max(0, Math.min(value, total - 1))
    }
}
