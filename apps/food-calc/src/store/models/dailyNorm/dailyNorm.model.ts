import { makeAutoObservable } from "mobx";
import { RequestState } from "@/api/RequestState";
import {
    getDailyNorms,
    createDailyNorm,
    updateDailyNorm,
    removeDailyNorm,
} from "@/api/dailyNorm/dailyNorm.api";
import { DailyNormEntity } from "@/store/models/dailyNorm/dailyNorm.types";

export class DailyNormModelStore {
    data: Map<string, DailyNormEntity> = new Map();

    constructor() {
        makeAutoObservable(this);
        this.getAll();
    }

    requestState: {
        getAll: RequestState | null;
        create: Map<string, RequestState>;
        update: Map<string, RequestState>;
        remove: Map<string, RequestState>;
    } = {
            getAll: null,
            create: new Map(),
            update: new Map(),
            remove: new Map(),
        };

    getAll = async () => {
        this.requestState.getAll = new RequestState("");
        const res = await getDailyNorms();

        if (!res.data) {
            this.requestState.getAll.fail("Failed to fetch daily norms");
            return;
        }

        res.data.forEach((norm) => {
            this.data.set(norm.id.toString(), norm);
        });

        this.requestState.getAll.success();
    };

    create = async (payload: Omit<DailyNormEntity, "id">) => {
        const state = new RequestState("");
        this.requestState.create.set("new", state);

        const res = await createDailyNorm(payload);

        if (!res.data) {
            state.fail("Failed to create daily norm");
            this.requestState.create.delete("new");
            return;
        }

        this.data.set(res.data.id.toString(), res.data);
        state.success();
        this.requestState.create.set(res.data.id.toString(), state);
        this.requestState.create.delete("new");
    };

    update = async (id: number, payload: DailyNormEntity) => {
        const key = id.toString();
        const state = new RequestState("");
        this.requestState.update.set(key, state);

        const res = await updateDailyNorm(id, payload);

        if (!res.data) {
            state.fail("Failed to update daily norm");
            return;
        }

        this.data.set(res.data.id.toString(), res.data);
        state.success();
    };

    remove = async (id: number) => {
        const key = id.toString();
        const state = new RequestState("");
        this.requestState.remove.set(key, state);

        const res = await removeDailyNorm(id);

        if (!res.data) {
            state.fail("Failed to remove daily norm");
            this.requestState.remove.delete(key);
            return;
        }

        this.data.delete(key);
        state.success();
        this.requestState.remove.delete(key);
    };

    set = async (id: number, entity: DailyNormEntity) =>
        this.data.set(id.toString(), entity);
}
