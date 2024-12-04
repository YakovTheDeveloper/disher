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
import { FetchManagerStore } from "@/store/dailyNormStore/fetchManagerStore";
import { DishFetchManager } from "@/store/rootDishStore/dishFetchManager";
import { UpdateDishPayload } from "@/types/api/menu";

// type IRootMenuStore = {
//     setCurrentDishId(id: number): void
//     productStore: ProductStore
// }

export const DRAFT_MENU_ID = -1;

export class RootDishStore {
  constructor(
    private productStore: ProductStore,
    private calculationStore: CalculationStore
  ) {
    makeAutoObservable(this);

    this.fetchManager = new DishFetchManager()

    autorun(() => {
      this.getAll();
    });

    reaction(
      () => [this.currentDish],
      ([dish]) => {
        if (!dish) return;
        if (this.currentAbortController) {
          this.currentAbortController.abort();
        }
        console.log("reaction 1, update");
        this.currentAbortController = new AbortController();
        this.calculationStore.resetNutrients();

        const productIds = dish.productIds;
        const productsToFetch =
          this.calculationStore.productStore.getMissingProductIds(productIds);
        const currentProducts = dish.products;

        if (isNotEmpty(productsToFetch)) {
          const currentController = this.currentAbortController;
          this.calculationStore.productStore
            .fetchAndSetProductNutrientsData(
              productsToFetch,
              this.currentAbortController.signal
            )
            .then((res) => {
              if (!res) return;
              if (currentController !== this.currentAbortController) return;
              this.calculationStore.update(currentProducts);
            });
        }
        if (isEmpty(productsToFetch)) {
          this.calculationStore.update(currentProducts);
        }
      }
    );

    reaction(
      () => [this.currentDish?.products.map((product) => toJS(product))],
      ([products]) => {
        if (!products) return;
        console.log("reaction 2, update");
        this.calculationStore.update(products);
      }
    );
  }

  draftDish: DraftDishStore = new DraftDishStore(this).setData({
    id: DRAFT_MENU_ID,
    name: "Новое блюдо",
    products: [],
  });

  userDishes: UserDishStore[] = [];

  currentDishId: number = DRAFT_MENU_ID;

  fetchManager: FetchManagerStore<IDish>

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
    this.fetchManager.getAll().then(
      action("fetchSuccess", (res) => {
        if (!res) return
        res.forEach((payload) => {
          this.addDishStore(this.createDishStore(payload));
        });
      }),
      action("fetchError", (error) => { })
    );
  };

  getOne = async (
    id: number
  ): Promise<{
    products: IProductWithNutrients[];
    dishIds: number[];
  }> => {
    return fetchGetDish(id).then(
      action("fetchSuccess", (res) => res.result),
      action("fetchError", (error) => { })
    );
  };

  removeDish = async (id: number): Promise<any> => {
    return this.fetchManager.delete(id).then(
      action("fetchSuccess", (res) => {
        if (!res) return
        this.currentDishId = DRAFT_MENU_ID;
        this.userDishes = this.userDishes.filter((dish) => dish.id !== id);
      }),
      action("fetchError", (error) => { })
    );
  };

  updateDish = async (payload: UpdateDishPayload, id: number): Promise<any> => {
    return this.fetchManager.update(id, payload).then(
      action("fetchSuccess", (res) => {
        if (!res) return
        this.currentDishId = DRAFT_MENU_ID;
        this.userDishes = this.userDishes.filter((dish) => dish.id !== id);
      }),
      action("fetchError", (error) => { })
    );
  };

  currentAbortController: AbortController | null = null;


}
