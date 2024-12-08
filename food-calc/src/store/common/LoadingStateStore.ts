import { action, computed, makeAutoObservable, makeObservable, observable, ObservableMap } from "mobx";

export type Loading = {
    all: boolean;
    save: boolean;
    getOne: ObservableMap<number, boolean>; // Added getOne
    update: ObservableMap<number, boolean>;
    delete: ObservableMap<number, boolean>;
};

export class LoadingStateStore {
    loadingStates: Loading = {
        all: false,
        save: false,
        getOne: observable.map<number, boolean>(), // Added initialization
        update: observable.map<number, boolean>(),
        delete: observable.map<number, boolean>(),
    };

    constructor() {
        makeAutoObservable(this);
    }

    setLoading(key: "all" | "save" | "getOne", value: boolean): void;
    setLoading(key: "update" | "delete" | "getOne", value: boolean, id: number): void;
    setLoading(key: keyof Loading, value: boolean, id?: number): void {
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
    getLoading(key: "update" | "delete" | "getOne", id: number): boolean;
    getLoading(key: keyof Loading, id?: number): boolean {
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
