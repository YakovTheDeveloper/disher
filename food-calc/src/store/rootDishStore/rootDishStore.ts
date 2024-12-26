import { action, autorun, computed, makeAutoObservable, makeObservable, observable, reaction, toJS } from "mobx";
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
import { RootEntityStore } from "@/store/common/types";
// type IRootMenuStore = {WW#
//     productStore: ProductStore
// }

export const DRAFT_MENU_ID = -1;

export class RootDishStore extends RootEntityStore<
  IDish,
  UserDishStore,
  DraftDishStore
> {
  constructor() {
    super(UserDishStore)
    makeObservable(this, {
      dishIds: computed,
      draftStore: observable,
    });

    autorun(() => {
      // this.getAll();
    });
  }

  draftStore: DraftDishStore = new DraftDishStore({
    id: DRAFT_MENU_ID,
    name: "",
    products: [],
  })

  fetchManager = new DishFetchManager(this.loadingState)

  get dishIds() {
    return this.stores.map(({ id }) => id);
  }

}
