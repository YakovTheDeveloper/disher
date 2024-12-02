import { UiStore } from "@/store/uiStore/uiStore";
import { CalculationStore } from "./calculationStore/calculationStore";

import { ProductStore } from "./productStore/productStore";
import { UserStore } from "@/store/userStore/userStore";
import { NutrientStore } from "@/store/nutrientStore/nutrientStore";
import { RootDayStore } from "@/store/rootDayStore/rootDayStore";
import { GetFullDataStore } from "@/store/getFullDataStore/getFullDataStore";
import { RootDishStore } from "@/store/rootDishStore/rootDishStore";
import { RootDailyNormStore } from "@/store/dailyNormStore/dailyNormStore";

export const productStore = new ProductStore();
export const nutrientStore = new NutrientStore();

export const dishCalculationStore = new CalculationStore();

export const rootDishStore = new RootDishStore(
  productStore,
  dishCalculationStore
);

// export const calculationStore = new CalculationStore()

export const UIStore = new UiStore();

export const userStore = new UserStore();

export const rootDayStore = new RootDayStore(rootDishStore);

//todo delete
export const getFullDataStore = new GetFullDataStore(
  rootDayStore,
  productStore,
  rootDishStore
);
export const rootDailyNormStore = new RootDailyNormStore();
