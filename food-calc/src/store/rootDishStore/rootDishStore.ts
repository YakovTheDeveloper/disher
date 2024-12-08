import { action, autorun, makeAutoObservable, reaction, toJS } from "mobx";
import { IProductBase, IProductWithNutrients } from "../../types/menu/Menu";
import {
  DraftDishStore,
  UserDishStore,
} from "@/store/rootDishStore/dishStore/dishStore";
import { fetchDeleteDish, fetchGetAllDishes, fetchGetDish } from "@/api/dish";
import { ProductStore } from "@/store/productStore/productStore";
import { CalculationStore } from "@/store/calculationStore/calculationStore";
import { isEmpty, isNotEmpty } from "@/lib/empty";
import { IDish } from "@/types/dish/dish";
import { DishFetchManager } from "@/store/rootDishStore/dishFetchManager";
import { UpdateDishPayload } from "@/types/api/menu";
import { LoadingStateStore } from "@/store/common/LoadingStateStore";
import { FetchManagerStore } from "@/store/common/FetchManagerStore";
import { CalculationReactionStore } from "@/store/rootDishStore/calculationReactionStore";
// type IRootMenuStore = {WW#
//     productStore: ProductStore
// }

export const DRAFT_MENU_ID = -1;

export class RootDishStore {
  constructor() {
    makeAutoObservable(this);

    autorun(() => {
      this.getAll();
    });
  }

  draftDish: DraftDishStore = new DraftDishStore(this).setData({
    id: DRAFT_MENU_ID,
    name: "Новое блюдо",
    products: [],
  });

  userDishes: UserDishStore[] = [];

  currentDishId: number = DRAFT_MENU_ID;

  loadingState = new LoadingStateStore()

  fetchManager = new DishFetchManager(this.loadingState)

  get dishes() {
    return [this.draftDish, ...this.userDishes];
  }

  get currentDish() {
    return this.dishes.find(({ id }) => id === this.currentDishId);
  }

  get dishIds() {
    return this.dishes.map(({ id }) => id);
  }

  getDishesProductsAsIds = (dishIds: string[]) => {
    const ids: Record<string, boolean> = {};
    this.dishes
      .filter(({ id }) => dishIds.includes(id))
      .forEach(({ products }) =>
        products.forEach(({ id }) => (ids[id] = true))
      );
    return Object.keys(ids);
  };

  get idToDishMapping() {
    return this.dishes.reduce(
      (acc, dish) => {
        acc[dish.id] = dish.products;
        return acc;
      },
      {} as Record<string, IProductBase[]>
    );
  }

  // getDishProductsByIds = (dishIds: string[]): IProductBase[] => {
  //     return dishIds.flatMap(dishId => this.idToDishMapping[dishId])
  // }

  // getCorrespondingDishesProductsIds = (dishIds: string[]) => {
  //     return Array.from(new Set(dishIds.flatMap(dishId => this.idToDishMapping[dishId].map(({ id }) => id))))
  // }

  setCurrentDishId = (id: number) => {
    this.currentDishId = id;
  };

  createDishStore = (payload: IDish) => {
    const store = new UserDishStore(this);
    store.setData(payload);
    store.detectChangesStore.setInitSnapshot(payload.products);
    return store;
  };

  addDishStore = (store: UserDishStore) => {
    this.userDishes.push(store);
  };

  getAll = async () => {
    return this.fetchManager.getAll().then((res) => {
      if (res.isError) {
        return res
      }

      res.data.forEach((payload) => {
        this.addDishStore(this.createDishStore(payload));
      });
      return res
    });
  };

  removeDish = async (id: number): Promise<any> => {
    return this.fetchManager.delete(id).then(
      action("fetchSuccess", (res) => {
        if (res.isError) return res
        this.currentDishId = DRAFT_MENU_ID;
        this.userDishes = this.userDishes.filter((dish) => dish.id !== id);
        return res
      }),
      action("fetchError", (error) => { })
    );
  };

  updateDish = async (payload: UpdateDishPayload, id: number) => {
    return this.fetchManager.update(id, payload).then(
      action("fetchSuccess", (res) => {
        if (res.isError) return res
        return res
      }),
    );
  };



  // testStore = new CalculationReactionStore(
  //   this.productStore,
  //   this.calculationStore,
  //   this
  // )


  // currentAbortController: AbortController | null = null;


}
