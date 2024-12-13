import { UiStore } from "@/store/uiStore/uiStore";
import { CalculationStore } from "./calculationStore/calculationStore";

import { ProductStore } from "./productStore/productStore";
import { UserStore } from "@/store/userStore/userStore";
import { NutrientStore } from "@/store/nutrientStore/nutrientStore";
import { RootDishStore } from "@/store/rootDishStore/rootDishStore";
import { RootDailyNormStore } from "@/store/dailyNormStore/dailyNormStore";
import { RootDayStore2 } from "@/store/rootDayStore/rootDayStore2";
import { CalculationReactionStore } from "@/store/rootDishStore/calculationReactionStore";
import { AddProductToDishUseCase } from "@/store/useCasesStore/addProductToDishUseCase";
import { DishFlow } from "@/store/useCasesStore/updateDishFlow";
import { NotificationStore } from "@/store/uiStore/notificationStore/notificationStore";

export const productStore = new ProductStore();
export const nutrientStore = new NutrientStore();
export const rootDailyNormStore = new RootDailyNormStore();

export const dishCalculationStore = new CalculationStore();
export const dayCalculationStore = new CalculationStore();

export const rootDishStore = new RootDishStore();
export const rootDayStore2 = new RootDayStore2();

export const currentCalculationStore = new CalculationReactionStore(
  productStore,
  rootDishStore,
  rootDayStore2,
  dishCalculationStore,
  dayCalculationStore
)

const notificationStore = new NotificationStore()
export const uiStore = new UiStore(notificationStore);

export const userStore = new UserStore();

export const addProductToDishUseCase = new AddProductToDishUseCase(
  rootDishStore,
  currentCalculationStore,
  productStore
)

export const Flows = {
  Dish: new DishFlow(
    rootDishStore,
    rootDayStore2,
    currentCalculationStore,
    notificationStore)
}