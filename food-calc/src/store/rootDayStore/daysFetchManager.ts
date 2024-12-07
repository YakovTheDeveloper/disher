import { fetchCreateDay, fetchDeleteDay, fetchGetAllDay, fetchUpdateDay } from "@/api/day";
import { fetchCreateDish, fetchDeleteDish, fetchGetAllDishes, fetchUpdateDish } from "@/api/dish";
import { FetchManagerStore } from "@/store/dailyNormStore/fetchManagerStore";
import { Day } from "@/types/day/day";
import { IDish } from "@/types/dish/dish";

export class DaysFetchManager extends FetchManagerStore<Day> {
    protected fetchCreate(payload: Day): Promise<{ result: Day; }> {

        return fetchCreateDay(payload)
    }
    protected fetchAll(): Promise<{ result: Day[]; }> {
        return fetchGetAllDay()
    }
    protected fetchUpdate(id: number, payload: Day): Promise<{ result: Day; }> {
        return fetchUpdateDay(id, payload)
    }
    protected fetchDelete(id: number): Promise<{ result: boolean; }> {
        return fetchDeleteDay(id)
    }

}