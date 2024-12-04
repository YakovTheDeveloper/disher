import {
  fetchCreateNorm,
  fetchGetAllNorm,
  fetchUpdateNorm,
  fetchDeleteNorm,
} from "@/api/norm";
import { FetchManager, Loading } from "@/store/common/FetchManagerStore";
import { DailyNormNoId } from "@/types/api/norm";
import { DailyNorm } from "@/types/norm/norm";
import {
  action,
  computed,
  makeObservable,
  observable,
  ObservableMap,
} from "mobx";

type Response<Data> = {
  result: Data;
};

// FetchManagerStore class
export abstract class FetchManagerStore<Data> implements FetchManager<Data> {
  constructor() {
    makeObservable(this, {
      loadingStates: observable,
      setLoading: action,
      getLoading: action,
      loading: computed,
    });
  }

  loadingStates: Loading = {
    all: false,
    save: false,
    update: observable.map<number, boolean>(),
    delete: observable.map<number, boolean>(),
  };

  get loading() {
    return this.loadingStates;
  }

  getLoadingStates() {
    return this.loadingStates;
  }

  // setLoading method to change loading states
  setLoading(key: "all" | "save", value: boolean): void;
  setLoading(key: "update" | "delete", value: boolean, id: number): void;
  setLoading(key: keyof Loading, value: boolean, id?: number): void {
    if (key === "update" || key === "delete") {
      if (id != null) {
        const field = this.loadingStates[key];
        field.set(id, value);
      }
    } else {
      this.loadingStates[key] = value;
    }
  }

  getLoading(key: "all" | "save"): boolean;
  getLoading(key: "update" | "delete", id: number): boolean;
  getLoading(key: keyof Loading, id?: number): boolean {
    if (key === "update" || key === "delete") {
      if (id != null) {
        return this.loadingStates[key].get(id) || false;
      }
    } else {
      return this.loadingStates[key];
    }
  }

  // Abstract methods that need to be implemented by subclasses
  protected abstract fetchAll(): Promise<Response<Data[]>>;
  protected abstract fetchCreate(
    payload: Omit<Data, "id">
  ): Promise<Response<Data>>;
  protected abstract fetchUpdate(
    id: number,
    payload: Omit<Data, "id">
  ): Promise<Response<Data>>;
  protected abstract fetchDelete(id: number): Promise<Response<boolean>>;

  // Fetch all data
  getAll = async (): Promise<Data[] | undefined> => {
    this.setLoading("all", true);
    try {
      const res = await this.fetchAll();
      if (!res?.result) return;
      return res?.result;
    } finally {
      this.setLoading("all", false);
    }
  };

  // Create data
  create = async (payload: Omit<Data, "id">): Promise<Data | undefined> => {
    this.setLoading("save", true);
    try {
      const res = await this.fetchCreate(payload);
      if (!res?.result) return;
      return res?.result;
    } finally {
      this.setLoading("save", false);
    }
  };

  // Update data
  update = async (id: number, payload: Omit<Data, "id">): Promise<Data | undefined> => {
    this.setLoading("update", true, id);
    try {
      const res = await this.fetchUpdate(id, payload);
      if (!res?.result) return;
      return res?.result;
    } finally {
      this.setLoading("update", false, id);
    }
  };

  // Delete data
  delete = async (id: number): Promise<boolean> => {
    this.setLoading("delete", true, id);
    try {
      const res = await this.fetchDelete(id);
      if (!res?.result) return false;
      return true;
    } finally {
      this.setLoading("delete", false, id);
    }
  };
}

// Concrete implementation for DailyNorm
export class DailyNormFetchManager extends FetchManagerStore<DailyNorm> {
  protected fetchAll(): Promise<Response<DailyNorm[]>> {
    return fetchGetAllNorm();
  }

  protected fetchCreate(payload: DailyNorm): Promise<Response<DailyNorm>> {
    return fetchCreateNorm(payload);
  }

  protected fetchUpdate(
    id: number,
    payload: DailyNorm
  ): Promise<Response<DailyNorm>> {
    return fetchUpdateNorm(id, payload);
  }

  protected fetchDelete(id: number): Promise<Response<boolean>> {
    return fetchDeleteNorm(id);
  }
}
