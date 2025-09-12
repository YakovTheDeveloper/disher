import { getDishes } from "@/api/dish/dish.api";
import { getSchedules } from "@/api/schedule/schedule.api";
import { DishEntity } from "@/store/models/dish/types";
import { ScheduleEntity } from "@/store/scheduleStore/types";
import { makeAutoObservable } from "mobx";

export class DishModelStore {
    data: Map<string, DishEntity> = new Map();

    constructor() {
        makeAutoObservable(this);
        this.getAll();
    }

    get idToDish() {
        return new Map(this.data);
    }

    getAll = async () => {
        const res = await getDishes();
        console.log("res.data", res);
        if (!res.data) return;
        this.data.clear();
        res.data.forEach((dish) => {
            this.data.set(dish.id.toString(), dish);
        });
    };

    set = async (id: number, schedule: DishEntity) => this.data.set(id.toString(), schedule);
    delete = async (id: number) => this.data.delete(id.toString());
}
