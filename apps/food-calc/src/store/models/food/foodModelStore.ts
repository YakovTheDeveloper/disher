import { getFood, getFoodWithNutrients, getOneFood } from "@/api/food/food.api";
import { requestWrapper } from "@/api/Request";
import { RequestState } from "@/api/RequestState";
import { isEmpty } from "@/lib/empty";
import { generateHashFromIdCollection } from "@/lib/hash/hash";
import { FoodEntity } from "@/store/models/food/types";
import { makeAutoObservable, toJS } from "mobx";

export class FoodModelStore {
    data: Map<string, FoodEntity & {
        nutrients?: {
            quantity: number;
            nutrientId: number;
        }[]
    }> = new Map();

    constructor() {
        makeAutoObservable(this);
        this.getAll();
    }

    requestState: Record<string, Map<string, RequestState>> = {
        getAllWithNutrients: new Map()
    }

    getAll = async (ids?: number[], withNutrients = false) => {
        const method = (withNutrients ? getFoodWithNutrients : getFood)
        const res = await requestWrapper(method, {}, ids);

        if (!res.data) return;
        res.data.forEach((dish) => {
            this.data.set(dish.id.toString(), dish);
        });
    };

    private _loadFoodWithNutrientsByFoodIds = async (ids: number[]) => {

        const state = new RequestState('')
        ids.forEach((id) => this.requestState.getAllWithNutrients.set(id.toString(), state))

        const res = await requestWrapper(getFoodWithNutrients, {}, ids);

        if (!res.data) {
            state.fail('error')
            ids.forEach((id) => this.requestState.getAllWithNutrients.delete(id.toString()))
            return state.data()
        };

        state.success()
        ids.forEach((id) => this.requestState.getAllWithNutrients.delete(id.toString()))
        res.data.forEach((dish) => {
            this.data.set(dish.id.toString(), dish);
        });
        return state.data()
    };

    getOne = async (id: number) => {
        const res = await getOneFood(id);
        if (!res.data) return;
        this.data.set(res.data.id.toString(), res.data);
    }

    loadFoodWithNutrientsByFoodIds = async (ids: number[]) => {
        ids = this.getIdsMissingFoodWithNutrients(ids)
        if (isEmpty(ids)) return [false, 'PASS' as const]
        const [isError] = await this._loadFoodWithNutrientsByFoodIds(ids);
        if (isError) return [isError, 'FAIL' as const]
        return [isError, 'DONE' as const]
    };

    private getIdsMissingFoodWithNutrients = (ids: number[]) => {
        const missing: number[] = [];
        ids.forEach((id) => {
            const exist = this.data.get(id.toString());
            if (!exist || exist.nutrients == null) {
                missing.push(id);
            }
        });
        return missing
    }

    set = async (id: number, schedule: FoodEntity) => this.data.set(id.toString(), schedule);
    delete = async (id: number) => this.data.delete(id.toString());
}
