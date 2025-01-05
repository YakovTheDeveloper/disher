
import { IMenu } from "@/types/menu/Menu";
import { makeAutoObservable } from "mobx";

export class DishUiStore {
    constructor() {
        makeAutoObservable(this)
    }

    searchContent: IMenu[] = []

    searchBarDishPage = ''
    searchBarDayPage = ''

    setSearch = (where: 'dishPage' | 'dayPage', value: string) => {
        if (where === 'dishPage') this.searchBarDishPage = value
        if (where === 'dayPage') this.searchBarDayPage = value
    }

    setSearchContent = (content: IMenu[]) => {
        this.searchContent = content
    }

}