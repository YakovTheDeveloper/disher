import { fetchCreateNorm, fetchDeleteNorm, fetchGetAllNorm } from "@/api/norm";
import { DetectChangesStore } from "@/store/common/DetectChangesStore";
import { FetchManager } from "@/store/common/FetchManagerStore";
import { LoadingStateStore } from "@/store/common/LoadingStateStore";
import { DraftStore, RootEntityStore, UserDataStore } from "@/store/common/types";
import {
  DailyNormFetchManager,
} from "@/store/dailyNormStore/fetchManagerStore";
import { DailyNorm } from "@/types/norm/norm";
import {
  action,
  autorun,
  makeAutoObservable,
  makeObservable,
  observable,
  reaction,
  toJS,
} from "mobx";

const DRAFT_ID = -1;

export type DailyNormNoId = Omit<DailyNorm, "id">;

export class RootDailyNormStore implements RootEntityStore {
  constructor() {
    makeAutoObservable(this);

    autorun(() => {
      this.getAll()
    });
  }

  loadingState = new LoadingStateStore()

  fetchManager: FetchManager<DailyNorm> = new DailyNormFetchManager(this.loadingState);

  currentId: number = DRAFT_ID;

  draftNorm = new DraftNormStore(this);

  norms: UserNormStore[] = [];

  dailyNormIdCurrentlyInUse: number = DRAFT_ID;

  get stores() {
    return [this.draftNorm, ...this.norms];
  }

  get currentStore() {
    return this.stores.find(({ id }) => id === this.currentId);
  }

  get currentDailyNormUsedInCalculations() {
    return this.stores.find(({ id }) => id === this.dailyNormIdCurrentlyInUse)?.payload;
  }

  setCurrentId = (id: number) => {
    this.currentId = id;
  };

  setCurrentDailyNormInUseId = (id: number) => {
    this.dailyNormIdCurrentlyInUse = id;
  };

  isDraftId = (id: number) => {
    return id === DRAFT_ID;
  };

  create = (norm: DailyNorm) => {
    const { id, ...nutrients } = norm;
    const store = new UserNormStore(this);
    store.id = id;
    store.nutrients = nutrients;
    return store;
  };

  add = (data: DailyNorm | DailyNorm[]) => {
    if (data instanceof Array) {
      const stores = data.map((result) => this.create(result));
      this.norms = [...this.norms, ...stores];
      return;
    }
    this.norms = [...this.norms, this.create(data)];
    this.setCurrentId(data.id);
  };

  getAll = async () => {
    return this.fetchManager.getAll().then((res) => {
      if (res.isError) return res;
      this.add(res.data);
      return res
    });
  }

  save = async (payload: DailyNormNoId) => {
    return this.fetchManager.create(payload).then((res) => {
      if (res.isError) return res;
      this.add(res.data);
      return res
    });
  };

  update = async (id: number, payload: DailyNorm) => {
    return this.fetchManager.update(+id, payload).then((res) => {
      return res
    });
  };

  remove = async (id: number) => {
    return this.fetchManager.delete(+id).then((res) => {
      if (res.isError) return res;
      this.norms = this.norms.filter((norm) => +norm.id !== +id);
      this.setCurrentId(DRAFT_ID);
      return res
    });
  };
}

export class DailyNormStore {
  constructor() {
    makeObservable(this, {
      name: observable,
      nutrients: observable,
      id: observable,
      updateNutrient: action,
      setName: action
    });
  }

  name = "Новая дневная норма";

  nutrients: Omit<DailyNorm, "id"> = structuredClone(nutrients);
  id: number = DRAFT_ID;

  get payload() {
    return this.nutrients;
  }

  updateNutrient = (nutrient: keyof Omit<DailyNorm, "id">, value: number) => {
    this.nutrients[nutrient] = value;
  };

  setName = (value: string) => this.name = value
}

export class UserNormStore
  extends DailyNormStore
  implements UserDataStore<Omit<DailyNorm, "id">> {

  constructor(private rootStore: RootDailyNormStore) {
    super();
    makeObservable(this, {});
    this.detectChangesStore = new DetectChangesStore(this.nutrients);

    reaction(
      () => [toJS(this.nutrients)],
      ([data]) => {
        this.detectChangesStore.setData(data);
      }
    );
  }

  save = async () => {
    return this.rootStore.update(this.id, this.payload).then((res) => {
      if (res.isError) return res
      this.detectChangesStore.updateSnapshot(this.nutrients);
      return res
    });
  };

  remove = async () => {
    //this.id
    return this.rootStore.remove(this.id);
  };

  get empty() {
    return false;
  }

  resetToInit = async () => {
    if (!this.detectChangesStore.initProductsSnapshotCopy) return;
    this.nutrients = this.detectChangesStore.initProductsSnapshotCopy;
  };

  // get loading() {
  //   const state = this.rootStore.loadingState.getLoading('update', this.id)
  //   return state.update.get(+this.id) || state.delete.get(+this.id) || false;
  // }

  detectChangesStore: DetectChangesStore<Omit<DailyNorm, "id">>;
}

export class DraftNormStore extends DailyNormStore implements DraftStore {
  constructor(private rootStore: RootDailyNormStore) {
    super();
    makeObservable(this, {});
  }

  save = async () => {
    return this.rootStore.save(this.payload);
  };

  get empty() {
    return false;
  }

  resetToInit = async () => {
    this.nutrients = structuredClone(nutrients);
  };
}

const nutrients = {
  protein: 51,
  fats: 70,
  carbohydrates: 275,
  sugar: 50,
  starch: 30,
  fiber: 25,
  energy: 2000,
  water: 2000,
  iron: 18,
  magnesium: 350,
  phosphorus: 700,
  potassium: 3500,
  sodium: 2300,
  zinc: 15,
  copper: 900,
  manganese: 2.3,
  selenium: 55,
  iodine: 150,
  vitaminA: 900,
  vitaminB1: 1.2,
  vitaminB2: 1.3,
  vitaminB3: 16,
  vitaminB4: 550,
  vitaminB5: 5,
  vitaminB6: 2,
  vitaminB9: 400,
  vitaminB12: 2.4,
  vitaminC: 90,
  vitaminD: 20,
  vitaminE: 15,
  vitaminK: 120,
  betaCarotene: 3000,
  alphaCarotene: 600,
};
