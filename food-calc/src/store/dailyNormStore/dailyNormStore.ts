import { fetchCreateNorm, fetchDeleteNorm, fetchGetAllNorm } from "@/api/norm";
import { DetectChangesStore } from "@/store/common/DetectChangesStore";
import { FetchManager } from "@/store/common/FetchManagerStore";
import { DraftStore, UserDataStore } from "@/store/common/types";
import {
  DailyNormFetchManager,
  FetchManagerStore,
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

const DRAFT_ID = "_";

export type DailyNormNoId = Omit<DailyNorm, "id">;

export class RootDailyNormStore {
  constructor() {
    makeAutoObservable(this);

    autorun(() => {
      this.fetchManager.getAll().then((norms) => {
        if (!norms) return;
        this.add(norms);
      });
    });
  }

  fetchManager: FetchManager<DailyNorm> = new DailyNormFetchManager();

  currentId: string | number = DRAFT_ID;

  draftNorm = new DraftNormStore(this);

  norms: UserNormStore[] = [];

  dailyNormIdCurrentlyInUse: string | number = DRAFT_ID;

  get stores() {
    return [this.draftNorm, ...this.norms];
  }

  get currentStore() {
    return this.stores.find(({ id }) => id === this.currentId);
  }

  setCurrentId = (id: number | string) => {
    this.currentId = id;
  };

  setCurrentDailyNormInUseId = (id: number | string) => {
    this.dailyNormIdCurrentlyInUse = id;
  };

  isDraftId = (id: number | string) => {
    return id === DRAFT_ID;
  };

  create = (norm: DailyNorm) => {
    const { id, ...nutrients } = norm;
    const store = new UserNormStore(this);
    store.id = id.toString();
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

  save = (payload: DailyNormNoId) => {
    this.fetchManager.create(payload).then((res) => {
      if (res.isError) return res;
      this.add(res.data);
      return res
    });
  };

  update = async (id: number | string, payload: DailyNorm) => {
    return this.fetchManager.update(+id, payload).then((res) => {
      return res
    });
  };

  remove = (id: number | string) => {
    this.fetchManager.delete(+id).then((res) => {
      if (res.isError) return;
      console.log(this.norms);
      this.norms = this.norms.filter((norm) => +norm.id !== +id);
      console.log(this.norms);
      this.setCurrentId(DRAFT_ID);
      return res
    });
  };
}

export class DailyNormStore {
  constructor(private rootStore: RootDailyNormStore) {
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
  id: string | number = DRAFT_ID;

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
    super(rootStore);
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
    this.rootStore.update(this.id, this.payload).then((res) => {
      console.log("res", res);
      res && this.detectChangesStore.updateSnapshot(this.nutrients);
    });
  };

  remove = async () => {
    //this.id
    this.rootStore.remove(this.id);
  };

  get empty() {
    return false;
  }

  resetToInit = async () => {
    if (!this.detectChangesStore.initProductsSnapshotCopy) return;
    this.nutrients = this.detectChangesStore.initProductsSnapshotCopy;
  };

  get loading() {
    const state = this.rootStore.fetchManager.loading;
    return state.update.get(+this.id) || state.delete.get(+this.id) || false;
  }

  detectChangesStore: DetectChangesStore<Omit<DailyNorm, "id">>;
}

export class DraftNormStore extends DailyNormStore implements DraftStore {
  constructor(private rootStore: RootDailyNormStore) {
    super(rootStore);
    makeObservable(this, {});
  }

  get loading() {
    return this.rootStore.fetchManager.loading.save;
  }

  save = async () => {
    this.rootStore.save(this.payload);
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
