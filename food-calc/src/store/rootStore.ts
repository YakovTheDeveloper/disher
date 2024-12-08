import { UiStore } from "@/store/uiStore/uiStore";
import { CalculationStore } from "./calculationStore/calculationStore";

import { ProductStore } from "./productStore/productStore";
import { UserStore } from "@/store/userStore/userStore";
import { NutrientStore } from "@/store/nutrientStore/nutrientStore";
import { RootDayStore } from "@/store/rootDayStore/rootDayStore";
import { GetFullDataStore } from "@/store/getFullDataStore/getFullDataStore";
import { RootDishStore } from "@/store/rootDishStore/rootDishStore";
import { RootDailyNormStore } from "@/store/dailyNormStore/dailyNormStore";
import { RootDayStore2 } from "@/store/rootDayStore/rootDayStore2";
import { CalculationReactionStore } from "@/store/rootDishStore/calculationReactionStore";

export const productStore = new ProductStore();
export const nutrientStore = new NutrientStore();

export const dishCalculationStore = new CalculationStore();



export const rootDishStore = new RootDishStore();

export const selectedDishCalculations = new CalculationReactionStore(
  productStore,
  dishCalculationStore,
  rootDishStore
)

export const uiStore = new UiStore();

export const userStore = new UserStore();

export const rootDayStore2 = new RootDayStore2();

export const rootDailyNormStore = new RootDailyNormStore();

