import { IProductBase } from "@/types/dish/dish";
import { makeAutoObservable, toJS } from "mobx";

export enum Modals {
  Auth = "Auth",
  Product = "Product",
}

type Payload = { Product: IProductBase | null };

export class UiStore {
  currentModal: Modals | null = null;

  data: {
    Auth: null;
    Product: IProductBase | null;
  } = {
    Auth: null,
    Product: null,
  };

  openModal = (id: Modals, data?: Payload) => {
    console.log(toJS(data?.Product));
    this.currentModal = id;
    if (!data) return;
    data.Product = structuredClone(toJS(data.Product));
    this.setData(data);
  };

  closeModal = () => {
    this.currentModal = null;
  };

  setData = (data: Payload) => {
    this.data = { ...this.data, ...data };
  };

  constructor() {
    makeAutoObservable(this);
  }
}
