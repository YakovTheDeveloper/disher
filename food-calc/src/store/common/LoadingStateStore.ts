import { action, computed, makeAutoObservable, makeObservable, observable, ObservableMap } from "mobx";

type Id = string | number

export type Loading = {
    all: boolean;
    save: boolean;
    getOne: ObservableMap<Id, boolean>; // Added getOne
    update: ObservableMap<Id, boolean>;
    delete: ObservableMap<Id, boolean>;
};

export class LoadingStateStore {
    loadingStates: Loading = {
        all: false,
        save: false,
        getOne: observable.map<Id, boolean>(), // Added initialization
        update: observable.map<Id, boolean>(),
        delete: observable.map<Id, boolean>(),
    };

    constructor() {
        makeAutoObservable(this);
    }

    setLoading(key: "all" | "save" | "getOne", value: boolean): void;
    setLoading(key: "update" | "delete" | "getOne", value: boolean, id: Id): void;
    setLoading(key: keyof Loading, value: boolean, id?: Id): void {
        if (key === "update" || key === "delete" || key === "getOne") {
            if (id != null) {
                const field = this.loadingStates[key];
                field.set(id, value);
            }
        } else {
            this.loadingStates[key] = value;
        }
    }

    getLoading(key: "all" | "save" | "getOne"): boolean;
    getLoading(key: "update" | "delete" | "getOne", id: Id): boolean;
    getLoading(key: keyof Loading, id?: Id): boolean {
        if (key === "update" || key === "delete" || key === "getOne") {
            if (id != null) {
                return this.loadingStates[key].get(id) || false;
            }
            return false;
        } else {
            return this.loadingStates[key];
        }
    }
}
