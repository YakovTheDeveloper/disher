import { ObservableMap } from "mobx";

export interface FetchManager<Data> {
  getAll: () => Promise<Data[] | undefined>;
  create: (payload: Omit<Data, "id">) => Promise<Data | undefined>;
  update: (id: number, payload: Data) => Promise<Data | undefined>;
  delete: (id: number) => Promise<boolean | undefined>;
  loading: Loading;
}

export type Loading = {
  all: boolean;
  save: boolean;
  update: ObservableMap<number, boolean>;
  delete: ObservableMap<number, boolean>;
};
