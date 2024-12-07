import { Response } from "@/types/api/common";
import { ObservableMap } from "mobx";



export interface FetchManager<Data> {
  getAll: () => Promise<Response<Data[]>>;
  create: (payload: Omit<Data, "id">) => Promise<Response<Data>>;
  update: (id: number, payload: Data) => Promise<Response<Data>>;
  delete: (id: number) => Promise<Response<boolean>>;
  loading: Loading;
}

export type Loading = {
  all: boolean;
  save: boolean;
  update: ObservableMap<number, boolean>;
  delete: ObservableMap<number, boolean>;
};
