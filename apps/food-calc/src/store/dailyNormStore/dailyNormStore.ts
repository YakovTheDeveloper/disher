import { fetchCreateNorm, fetchDeleteNorm, fetchGetAllNorm } from "@/api/norm";
import { DetectChangesStore } from "@/store/common/DetectChangesStore";
import { FetchManager } from "@/store/common/FetchManagerStore";
import { LoadingStateStore } from "@/store/common/LoadingStateStore";
import { DraftStore, RootEntity, RootEntityStore, UserDataStore } from "@/store/common/types";
import {
  DailyNormFetchManager,
} from "@/store/dailyNormStore/fetchManagerStore";
import { UserDayStore2 } from "@/store/rootDayStore/dayStore2";
import { Flows } from "@/store/rootStore";
import { DailyNorm, DailyNormV2 } from "@/types/norm/norm";
import { GenerateId } from "@/utils/uuidNumber";
import {
  action,
  autorun,
  computed,
  makeAutoObservable,
  makeObservable,
  observable,
  reaction,
  toJS,
} from "mobx";

const DRAFT_ID = -1;

export type DailyNormNoId = Omit<DailyNorm, "id">;

export class RootDailyNormStore extends RootEntityStore<DailyNormV2, UserNormStore, DraftNormStore> {
  constructor() {
    super(UserNormStore)
    makeObservable(this, {
      dailyNormIdCurrentlyInUse: observable,
      draftStore: observable,
      currentDailyNormUsedInCalculations: computed,
      setCurrentDailyNormInUseId: action
    });
  }

  draftStore = new DraftNormStore({ id: -1, nutrients: structuredClone(nutrientsInit), name: 'Новая дневная норма' })

  fetchManager: FetchManager<DailyNormV2> = new DailyNormFetchManager(this.loadingState);

  defaultNorms = [
    new DefaultNormStore('Стандарт', nutrientsInit),
    new DefaultNormStore('Спорт', nutrientsInit)
  ]

  dailyNormIdCurrentlyInUse: number = this.defaultNorms[0].id;

  get stores() {
    return [this.draftStore, ...this.defaultNorms, ...this.userStores];
  }

  get currentDailyNormUsedInCalculations() {
    return this.stores.find(({ id }) => id === this.dailyNormIdCurrentlyInUse)?.nutrients;
  }

  setCurrentDailyNormInUseId = (id: number) => {
    this.dailyNormIdCurrentlyInUse = id;
  };

}

export class DailyNormStore {
  constructor(data: DailyNormV2) {
    makeObservable(this, {
      name: observable,
      nutrients: observable,
      id: observable,
      updateNutrient: action,
      setName: action
    });
    const { id, nutrients, name } = data
    this.id = id
    this.nutrients = nutrients
    this.name = name
  }

  name = "Новая дневная норма";

  nutrients: Omit<DailyNorm, "id"> = structuredClone(nutrientsInit);
  id: number = DRAFT_ID;

  get payload(): Omit<DailyNormV2, "id"> {
    return {
      name: this.name,
      nutrients: this.nutrients
    };
  }

  updateNutrient = (nutrient: keyof DailyNormV2['nutrients'], value: number) => {
    this.nutrients[nutrient] = value;
  };

  setName = (value: string) => this.name = value
}

export class DefaultNormStore {
  constructor(name: string, initNutrients: Omit<DailyNorm, "id">) {
    makeAutoObservable(this);
    this.name = name
    this.nutrients = initNutrients
  }
  name = "Новая дневная норма";
  nutrients: Omit<DailyNorm, "id"> = structuredClone(nutrientsInit);
  id: number = GenerateId();
}

export class UserNormStore
  extends DailyNormStore
  implements UserDataStore<Omit<DailyNorm, "id">> {

  constructor(data: DailyNormV2) {
    super(data);
    makeObservable(this, {});
    this.detectChangesStore = new DetectChangesStore(this.nutrients);

    reaction(
      () => [toJS(this.nutrients)],
      ([data]) => {
        this.detectChangesStore.setData(data);
      }
    );
  }

  get empty() {
    return false;
  }

  resetToInit = async () => {
    if (!this.detectChangesStore.initProductsSnapshotCopy) return;
    this.nutrients = this.detectChangesStore.initProductsSnapshotCopy;
  };

  detectChangesStore: DetectChangesStore<Omit<DailyNorm, "id">>;
}

export class DraftNormStore extends DailyNormStore implements DraftStore {
  constructor(data: DailyNormV2) {
    super(data);
    makeObservable(this, {});
  }

  get empty() {
    return false;
  }

  resetToInit = async () => {
    this.nutrients = structuredClone(nutrientsInit);
  };
}

const nutrientsInit = {
  protein: 51,
  fats: 70,
  carbohydrates: 275,
  sugar: 50,
  starch: 30,
  fiber: 25,
  energy: 2000,
  water: 2000,
  iron: 18,
  calcium: 1000,
  magnesium: 350,
  phosphorus: 700,
  potassium: 3500,
  sodium: 2300,
  zinc: 15,
  copper: 900,
  manganese: 2300,
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
