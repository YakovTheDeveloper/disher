import { CalculationStore } from "./calculationStore/calculationStore";
import { MenuStore } from "./menuStore/menuStore";
import { ProductStore } from "./productStore/productStore";



export const Menus = new MenuStore()
export const productStore = new ProductStore()
export const calculationStore = new CalculationStore()