import { LoadingStateStore } from "@/store/common/LoadingStateStore";
import { Response } from "@/types/api/common";
import { makeObservable, ObservableMap } from "mobx";

export interface FetchManager<Data> {
  getAll: (params?: any) => Promise<Response<Data[]>>;
  create: (payload: Omit<Data, "id">) => Promise<Response<Data>>;
  update: (id: number, payload: Data) => Promise<Response<Data>>;
  delete: (id: number) => Promise<Response<boolean>>;
  loadingStore: LoadingStateStore;
}

export abstract class FetchManagerStore<Data> implements FetchManager<Data> {
  constructor(loadingStore: LoadingStateStore) {
    this.loadingStore = loadingStore;
    makeObservable(this, {
    });
  }

  loadingStore: LoadingStateStore

  protected abstract fetchAll(params?: any): Promise<Response<Data[]>>;
  protected abstract fetchCreate(
    payload: Omit<Data, "id">
  ): Promise<Response<Data>>;
  protected abstract fetchUpdate(
    id: number,
    payload: Omit<Data, "id">
  ): Promise<Response<Data>>;
  protected abstract fetchDelete(id: number): Promise<Response<boolean>>;

  getAll = async (params?: any) => {
    this.loadingStore.setLoading("all", true);
    const res = await this.fetchAll(params);
    this.loadingStore.setLoading("all", false);
    return res
  };

  create = async (payload: Omit<Data, "id">) => {
    this.loadingStore.setLoading("save", true);
    const res = await this.fetchCreate(payload);
    this.loadingStore.setLoading("save", false);
    return res
  };

  update = async (id: number, payload: Omit<Data, "id">) => {
    this.loadingStore.setLoading("update", true, id);
    const res = await this.fetchUpdate(id, payload);
    this.loadingStore.setLoading("update", false, id);
    return res
  };

  delete = async (id: number) => {
    this.loadingStore.setLoading("delete", true, id);
    const res = await this.fetchDelete(id);
    this.loadingStore.setLoading("delete", false, id);
    return res
  };
}
