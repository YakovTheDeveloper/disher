import { UiStore } from "@/store/uiStore/uiStore";
import { CalculationStore } from "@/store/calculationStore/calculationStore";

import { ProductStore } from "./productStore/productStore";
import { UserStore } from "@/store/userStore/userStore";
import { NutrientStore } from "@/store/nutrientStore/nutrientStore";
import { RootDishStore } from "@/store/rootDishStore/rootDishStore";
import { RootDailyNormStore } from "@/store/dailyNormStore/dailyNormStore";
import { RootDayStore2 } from "@/store/rootDayStore/rootDayStore2";
import { CalculationReactionStore } from "@/store/rootDishStore/calculationReactionStore";
import { AddProductToDishUseCase } from "@/store/useCasesStore/addProductToDishUseCase";
import { DishFlow } from "@/store/useCasesStore/dishFlow";
import { NotificationStore } from "@/store/uiStore/notificationStore/notificationStore";
import { DayFlow } from "@/store/useCasesStore/dayFlow";
import { DailyNormFlow } from "@/store/useCasesStore/dailyNormFlow";
import { InitSetupFlow } from "@/store/useCasesStore/initSetupFlow";
import { ModalStore } from "@/store/uiStore/modalStore/modalStore";

export const productStore = new ProductStore();
export const nutrientStore = new NutrientStore();
export const rootDailyNormStore = new RootDailyNormStore();

export const dishCalculationStore = new CalculationStore(nutrientStore, productStore);
export const dayCalculationStore = new CalculationStore(nutrientStore, productStore);

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

export const modalStore = new ModalStore()
export const uiStore = new UiStore(notificationStore, modalStore);

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
    notificationStore,
    productStore
  ),
  Day: new DayFlow(
    rootDayStore2,
    notificationStore
  ),
  Norm: new DailyNormFlow(
    rootDailyNormStore,
    notificationStore
  )
}

export const initSetupFlow = new InitSetupFlow(userStore, Flows)