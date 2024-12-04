import { fetchCreateDish, fetchDeleteDish, fetchGetAllDishes, fetchUpdateDish } from "@/api/dish";
import { FetchManagerStore } from "@/store/dailyNormStore/fetchManagerStore";
import { IDish } from "@/types/dish/dish";

export class DishFetchManager extends FetchManagerStore<IDish> {
    protected fetchCreate(payload: Omit<IDish, "id">): Promise<{ result: IDish; }> {

        return fetchCreateDish(payload)
    }
    protected fetchAll(): Promise<{ result: IDish[]; }> {
        return fetchGetAllDishes()
    }
    protected fetchUpdate(id: number, payload: IDish): Promise<{ result: IDish; }> {
        return fetchUpdateDish(id, payload)
    }
    protected fetchDelete(id: number): Promise<{ result: boolean; }> {
        return fetchDeleteDish(id)
    }

}