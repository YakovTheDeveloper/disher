import { getFood, getFoodWithNutrients, getOneFood } from "@/api/food/food.api";
import { FoodEntity } from "@/store/models/food/types";
import { makeAutoObservable } from "mobx";

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

    getAll = async (ids?: number[], withNutrients = false) => {
        const res = await (withNutrients ? getFoodWithNutrients : getFood)(ids);
        if (!res.data) return;
        res.data.forEach((dish) => {
            this.data.set(dish.id.toString(), dish);
        });
    };

    getOne = async (id: number) => {
        const res = await getOneFood(id);
        if (!res.data) return;
        this.data.set(res.data.id.toString(), res.data);
    }

    getWithNutrientsByFoodIds = (ids: {
        id: number
    }[]) => {
        const idsNeedToFetch: number[] = [];
        ids.forEach(({ id }) => {
            const exist = this.data.get(id.toString());
            if (!exist || exist.nutrients == null) {
                idsNeedToFetch.push(id);
            }
        });
        if (idsNeedToFetch.length > 0) {
            this.getAll(idsNeedToFetch, true);
        }
    };

    set = async (id: number, schedule: FoodEntity) => this.data.set(id.toString(), schedule);
    delete = async (id: number) => this.data.delete(id.toString());
}
