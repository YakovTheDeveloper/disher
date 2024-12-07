import {
  fetchCreateNorm,
  fetchGetAllNorm,
  fetchUpdateNorm,
  fetchDeleteNorm,
} from "@/api/norm";
import { FetchManager, Loading } from "@/store/common/FetchManagerStore";
import { Response } from "@/types/api/common";
import { DailyNorm } from "@/types/norm/norm";
import {
  action,
  computed,
  makeObservable,
  observable,
} from "mobx";

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
      return false
    } else {
      return this.loadingStates[key];
    }
  }

  protected abstract fetchAll(): Promise<Response<Data[]>>;
  protected abstract fetchCreate(
    payload: Omit<Data, "id">
  ): Promise<Response<Data>>;
  protected abstract fetchUpdate(
    id: number,
    payload: Omit<Data, "id">
  ): Promise<Response<Data>>;
  protected abstract fetchDelete(id: number): Promise<Response<boolean>>;

  getAll = async () => {
    this.setLoading("all", true);
    const res = await this.fetchAll();
    this.setLoading("all", false);
    return res
  };

  create = async (payload: Omit<Data, "id">) => {
    this.setLoading("save", true);
    const res = await this.fetchCreate(payload);
    this.setLoading("save", false);
    return res
  };

  update = async (id: number, payload: Omit<Data, "id">) => {
    this.setLoading("update", true, id);
    const res = await this.fetchUpdate(id, payload);
    this.setLoading("update", false, id);
    return res
  };

  delete = async (id: number) => {
    this.setLoading("delete", true, id);
    const res = await this.fetchDelete(id);
    this.setLoading("delete", false, id);
    return res
  };
}

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
