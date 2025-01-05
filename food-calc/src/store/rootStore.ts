import { UiStore } from "@/store/uiStore/uiStore";
import { CalculationStore } from "@/store/calculationStore/calculationStore";

import { ProductStore } from "./productStore/productStore";
import { UserStore } from "@/store/userStore/userStore";
import { NutrientStore } from "@/store/nutrientStore/nutrientStore";
import { RootDishStore } from "@/store/rootDishStore/rootDishStore";
import { RootDailyNormStore } from "@/store/dailyNormStore/dailyNormStore";
import { RootDayStore2 } from "@/store/rootDayStore/rootDayStore2";
import { CalculationReactionStore } from "@/store/rootDishStore/calculationReactionStore";
import { DishFlow } from "@/store/useCasesStore/dishFlow";
import { NotificationStore } from "@/store/uiStore/notificationStore/notificationStore";
import { DayFlow } from "@/store/useCasesStore/dayFlow";
import { DailyNormFlow } from "@/store/useCasesStore/dailyNormFlow";
import { InitSetupFlow } from "@/store/useCasesStore/initSetupFlow";
import { ModalStore } from "@/store/uiStore/modalStore/modalStore";
import { RootProductStore } from "@/store/productStore/rootProductStore";
import { ProductFlow } from "@/store/useCasesStore/productFlow";
import { NutrientUiStore } from "@/store/uiStore/nutrientUiStore/nutrientUiStore";
import { DishUiStore } from "@/store/uiStore/dishUiStore/dishUiStore";

const notificationStore = new NotificationStore()

export const rootProductStore = new RootProductStore()

const productFlow = new ProductFlow(
  rootProductStore,
  notificationStore
)


export const productStore = new ProductStore();
export const nutrientStore = new NutrientStore();
export const rootDailyNormStore = new RootDailyNormStore();

export const dishCalculationStore = new CalculationStore(rootProductStore, productStore);
export const dayCalculationStore = new CalculationStore(rootProductStore, productStore);

export const rootDishStore = new RootDishStore();
export const rootDayStore2 = new RootDayStore2();

export const currentCalculationStore = new CalculationReactionStore(
  rootDishStore,
  rootDayStore2,
  dishCalculationStore,
  dayCalculationStore,
  productFlow
)


export const modalStore = new ModalStore()
const nutrientUiStore = new NutrientUiStore()
const dishUiStore = new DishUiStore()
export const uiStore = new UiStore(notificationStore, modalStore, nutrientUiStore, dishUiStore);

export const userStore = new UserStore();


export const dishFlow = new DishFlow(
  rootDishStore,
  rootDayStore2,
  currentCalculationStore,
  notificationStore,
  productStore,
  productFlow,
  dishUiStore
)

export const Flows = {
  Product: productFlow,
  Dish: dishFlow,
  Day: new DayFlow(
    rootDayStore2,
    notificationStore
  ),
  Norm: new DailyNormFlow(
    rootDailyNormStore,
    notificationStore
  ),

}

export const initSetupFlow = new InitSetupFlow(userStore, Flows)