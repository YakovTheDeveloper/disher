import { getFood } from "@/api/food/food.api";
import { FoodEntity } from "@/store/models/food/types";
import { makeAutoObservable } from "mobx";

export class FoodModelStore {
    data: Map<string, FoodEntity> = new Map();

    constructor() {
        makeAutoObservable(this);
        this.getAll();
    }

    // get map() {
    //     return new Map(this.data);
    // }

    getAll = async () => {
        const res = await getFood();
        console.log("res.data", res);
        if (!res.data) return;
        this.data.clear();
        res.data.forEach((dish) => {
            this.data.set(dish.id.toString(), dish);
        });
    };

    set = async (id: number, schedule: FoodEntity) => this.data.set(id.toString(), schedule);
    delete = async (id: number) => this.data.delete(id.toString());
}
