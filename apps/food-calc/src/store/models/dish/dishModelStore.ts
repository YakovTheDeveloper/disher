import { getDishes } from "@/api/dish/dish.api";
import { GetFoodParams } from "@/api/food/food.api";
import { getSchedules } from "@/api/schedule/schedule.api";
import { DishEntity } from "@/store/models/dish/types";
import { ScheduleEntity } from "@/store/models/schedule/types";
import { makeAutoObservable } from "mobx";

export class DishModelStore {
    data: Map<string, DishEntity> = new Map();

    constructor() {
        makeAutoObservable(this);
        // this.getAll();
    }

    get idToDish() {
        return new Map(this.data);
    }

    get list() {
        return Array.from(this.data.values())
    }

    // getAll = async () => {
    //     const res = await getDishes();
    //     console.log("res.data", res);
    //     if (!res.data) return;
    //     this.data.clear();
    //     res.data.forEach((dish) => {
    //         this.data.set(dish.id.toString(), dish);
    //     });
    // };

    set = async (id: number, schedule: DishEntity) => this.data.set(id.toString(), schedule);
    delete = async (id: number) => this.data.delete(id.toString());

    getAllWithParams = async (params: GetFoodParams) => {
        const result = await getDishes(params);
        if (!result.data) return {
            items: [],
            hasMore: false
        }

        result.data.items.forEach((food) => {
            this.data.set(food.id.toString(), food);
        });
        return result.data
    }
}
