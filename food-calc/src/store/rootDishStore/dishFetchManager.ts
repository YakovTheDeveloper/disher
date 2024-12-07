import { fetchCreateDish, fetchDeleteDish, fetchGetAllDishes, fetchUpdateDish } from "@/api/dish";
import { FetchManagerStore } from "@/store/dailyNormStore/fetchManagerStore";
import { IDish } from "@/types/dish/dish";

export class DishFetchManager extends FetchManagerStore<IDish> {
    protected fetchCreate(payload: Omit<IDish, "id">) {
        return fetchCreateDish(payload)
    }
    protected fetchAll() {
        return fetchGetAllDishes()
    }
    protected fetchUpdate(id: number, payload: IDish) {
        return fetchUpdateDish(id, payload)
    }
    protected fetchDelete(id: number) {
        return fetchDeleteDish(id)
    }

}