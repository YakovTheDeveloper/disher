import { IProductBase } from "@/types/dish/dish";
import { NutrientData } from "@/types/nutrient/nutrient";
import { makeAutoObservable, toJS } from "mobx";

type Payload = { Product: IProductBase | null };

type ModalData = {
    Auth: null;
    Product: IProductBase | null;
    NutrientRichProduct: NutrientData | null
}

export enum Modals {
    Auth = "Auth",
    Product = "Product",
    NutrientRichProduct = "NutrientRichProduct",
}

export class ModalStore {
    constructor() {
        makeAutoObservable(this);
    }

    currentModal: Modals | null = null;

    data: ModalData = {
        Auth: null,
        Product: null,
        NutrientRichProduct: null
    };

    openModal<T extends Modals>(id: T, data?: ModalData[T]) {
        this.currentModal = id;
        if (data !== undefined) {
            this.data[id] = data;
        }
    }

    closeModal = () => {
        this.currentModal = null;
    };

    clearData() {
        this.data = {
            Auth: null,
            Product: null,
            NutrientRichProduct: null
        };
    }

    // setData = (data: Payload) => {
    //     this.data = { ...this.data, ...data };
    // };
}
