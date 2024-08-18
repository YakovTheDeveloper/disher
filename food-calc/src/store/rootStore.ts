import { CalculationStore } from "./calculationStore/calculationStore";
import { MenuStore } from "./menuStore/menuStore";
import { ProductStore } from "./productStore/productStore";



export const Menus = new MenuStore()

export const calculationStore = new CalculationStore()

export const productStore = new ProductStore()