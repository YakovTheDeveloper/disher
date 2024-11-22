import { UiStore } from "@/store/uiStore/uiStore";
import { CalculationStore } from "./calculationStore/calculationStore";
import { RootMenuStore } from "./rootMenuStore/rootMenuStore";
import { ProductStore } from "./productStore/productStore";
import { UserStore } from "@/store/userStore/userStore";
import { NutrientStore } from "@/store/nutrientStore/nutrientStore";
import { RootDayStore } from "@/store/dayStore/rootDayStore";

export const nutrientStore = new NutrientStore()
export const productStore = new ProductStore()

export const rootMenuStore = new RootMenuStore(productStore)

// export const calculationStore = new CalculationStore()

export const UIStore = new UiStore()

export const userStore = new UserStore()

export const rootDayStore = new RootDayStore()