import { getFoodList, GetFoodParams, getFoodWithNutrientsByIds, getOneFood } from "@/api/food/food.api";
import { requestWrapper } from "@/api/Request";
import { RequestState } from "@/api/RequestState";
import { isEmpty } from "@/lib/empty";
import { generateHashFromIdCollection } from "@/lib/hash/hash";
import { FoodEntity } from "@/store/models/food/types";
import { makeAutoObservable, toJS } from "mobx";

type FoodEntityFull = FoodEntity & {
    nutrients?: {
        quantity: number;
        nutrientId: number;
    }[]
}

export class FoodModelStore {
    data: Map<string, FoodEntityFull> = new Map();

    shortData: FoodEntity[] = []

    setShortData = (data: FoodEntity[]) => {
        this.shortData = [...this.shortData, ...data]
    }

    get list() {
        return Array.from(this.data.values())
    }

    constructor() {
        makeAutoObservable(this);
        // this.getAll();
    }

    requestState = {
        getAllWithNutrients: new Map<string, RequestState>()
    }

    // getAll = async (ids?: number[], withNutrients = false) => {
    //     const method = (withNutrients ? getFoodWithNutrientsByIds : getFood)
    //     const res = await requestWrapper(method, {}, ids);

    //     if (!res.data) return;
    //     res.data.forEach((dish) => {
    //         this.data.set(dish.id.toString(), dish);
    //     });
    // };

    getFoodWithParams = async (params: GetFoodParams) => {
        const result = await getFoodList(params);
        if (!result.data) return {
            items: [],
            hasMore: false
        }

        result.data.items.forEach((food) => {
            this.data.set(food.id.toString(), food);
        });
        return result.data
    }

    private _loadFoodWithNutrientsByFoodIds = async (ids: number[]) => {

        const state = new RequestState('')
        ids.forEach((id) => this.requestState.getAllWithNutrients.set(id.toString(), state))

        const res = await requestWrapper(getFoodWithNutrientsByIds, {}, ids);

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

    getOneByDate = async (date: number) => {
        const res = await getOneFood(id);
        if (!res.data) return;
        this.data.set(res.data.id.toString(), res.data);
    }

    loadFoodWithNutrientsByFoodIds = async (ids: number[]) => {
        ids = this.getIdsMissingFoodWithNutrients(ids)
        if (isEmpty(ids)) return [false, 'NO_FETCH_NEEDED' as const]
        const [isError] = await this._loadFoodWithNutrientsByFoodIds(ids);
        if (isError) return [isError, 'FAIL' as const]
        return [isError, 'FETCH_DONE' as const]
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

    set = async (id: number, schedule: FoodEntityFull) => this.data.set(id.toString(), schedule);
    delete = async (id: number) => this.data.delete(id.toString());
}
