import { makeAutoObservable } from "mobx"
import { IMenu, IProductBase } from "../../types/menu/Menu"
import { v4 as uuidv4 } from 'uuid';
import { IProducts } from "../../types/product/product";

type IProductStore = {

}

export class ProductStore implements IProductStore {

    products: IProducts = {
        1: {
            id: "1",
            name: 'Apples',
            content: {
                main: {
                    carb: 50,
                    fat: 0,
                    protein: 1
                }
            }
        },
        2: {
            id: "2",
            name: 'Oranges',
            content: {
                main: {
                    carb: 25,
                    fat: 0,
                    protein: 1
                }
            }
        }
    }



    constructor() {
        makeAutoObservable(this)
    }




}
