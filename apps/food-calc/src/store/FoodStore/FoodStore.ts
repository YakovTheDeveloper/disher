import { types, flow, Instance } from "mobx-state-tree";
import { getFoodList, GetFoodParams, getFoodWithNutrients, getFoodWithNutrientsByIds, getOneFood } from "@/api/food/food.api";
import { RequestState, ResponseStatus } from "@/api/RequestState";
import { isEmpty } from "@/lib/empty";
import { Food } from "@/domain/product/Food.model";
import { runInAction } from "mobx";
import { createDataStoreModel } from "@/store/shared/DataStore";
import { createInitialProductMapping } from "@/store/FoodStore/init";

type GetFoodListResult = Awaited<ReturnType<typeof getFoodList>>;
type GetFoodNutrientsByIdResult = Awaited<ReturnType<typeof getFoodWithNutrientsByIds>>;

// const loadInitialFoods = flow(function* (): Generator<any> {
//     interface FoodEntry {
//         id: string;
//         name: string;
//         description: string;
//         nutrients: {
//             nutrientId: string;
//             quantity: number;
//         }[];
//     }

//     const data: FoodEntry[] = yield fetch('/foodFull.json').then(r => r.json());
//     data.forEach(food => {
//         (food as any).createByUser = false;
//         addFoodOrNutrientsIfNotExists(food)
//     })
// });

export const StoreModel = types
    .model("FoodModelStore", {
        total: types.optional(types.number, 0),
        hasMore: types.optional(types.boolean, true),
        requestState: types.optional(
            types.model({
                getAllWithNutrients: types.map(
                    types.frozen<RequestState>() // store object as is
                )
            }),
            {}
        )
    })
    .views((self) => ({
        isOneOfProductsIsLoading(foodIds: string[]) {
            const entries = Array.from(self.requestState.getAllWithNutrients.keys());
            return entries.some((key) =>
                foodIds.some((key2) => key === key2.toString())
            )
        }
    }))

export const FoodModelStore = types.compose(
    "ProductStore",
    StoreModel,
    createDataStoreModel("ProductStoreData", Food, createInitialProductMapping)
).actions((self) => {

    function getIdsMissingFoodWithNutrients(ids: number[]) {
        const missing: number[] = [];
        ids.forEach((id) => {
            const exist = self.data.get(String(id));
            if (!exist || !exist.nutrients) missing.push(id);
        });
        return missing;
    }

    const getFoodWithParams = flow(function* (params: GetFoodParams) {
        const result: GetFoodListResult = yield getFoodList(params);

        if (!result?.data) return { items: [], hasMore: false };

        result.data.items.forEach((food) => {
            self.data.set(food.id.toString(), { ...food, id: food.id.toString() });
        });

        return result.data;
    });

    const getOne = flow(function* (id: number) {
        const res = yield getOneFood(id);
        if (!res.data) return;
        self.data.set(String(res.data.id), res.data);
    });

    const getOneByDate = flow(function* (date: number) {
        const res = yield getOneFood(date); // assuming same API
        if (!res.data) return;
        self.data.set(String(res.data.id), res.data);
    });

    const _loadFoodWithNutrientsByFoodIds = flow(function* (ids: string[]): Generator<
        Promise<GetFoodNutrientsByIdResult>, // тип промиса, который ты yield-ишь
        ResponseStatus,           // return type
        GetFoodNutrientsByIdResult          // то, что "res" в итоге получит
    > {
        const state = new RequestState("");

        ids.forEach((id) => {
            self.requestState.getAllWithNutrients.set(String(id), state);
        });

        const res = yield getFoodWithNutrientsByIds(ids)

        if (!res.data) {
            state.fail("error");
            ids.forEach((id) => self.requestState.getAllWithNutrients.delete(String(id)));
            return state.status();
        }

        state.success();
        ids.forEach((id) => self.requestState.getAllWithNutrients.delete(String(id)));

        res.data.forEach(({ id, nutrients }) => {
            const food = self.data.get(String(id));
            console.log("hellohello", food);
            food?.setNutrients(nutrients)
        });

        return state.status();
    });

    const addFoodOrNutrientsIfNotExists = (food: typeof foodFullData[0]) => {
        const key = food.id
        const existFood = self.user.getById(key) || self.base.getById(key)

        try {
            if (!existFood) {
                const convertedNutrients = food.nutrients.map(n => ({
                    ...n,
                    nutrient: n.nutrientId
                }))
                const newFood = Food.create({
                    ...food,
                    nutrients: convertedNutrients,
                    nameEng: '',
                });
                runInAction(() => self.user.set(key, newFood))
                return
            }

            if (isEmpty(existFood?.nutrients)) {
                existFood.setNutrients(food.nutrients)
            }
        } catch (error) {
            console.error(error)
        }

    }

    // const loadInitialFoods = flow(function* (): Generator<any> {
    //     interface FoodEntry {
    //         id: string;
    //         name: string;
    //         description: string;
    //         nutrients: {
    //             nutrientId: string;
    //             quantity: number;
    //         }[];
    //     }

    //     const data: FoodEntry[] = yield fetch('/foodFull.json').then(r => r.json());
    //     data.forEach(food => {
    //         (food as any).createByUser = false;
    //         addFoodOrNutrientsIfNotExists(food)
    //     })
    // });

    const loadFoodWithNutrientsByFoodIds = flow(function* (ids: string[]): Generator<
        Promise<ResponseStatus>,
        [boolean, "NO_FETCH_NEEDED" | "FAIL" | "FETCH_DONE"],
        ResponseStatus
    > {
        if (isEmpty(ids)) return [false, "NO_FETCH_NEEDED" as const];

        const [isError] = yield _loadFoodWithNutrientsByFoodIds(ids);

        if (isError) return [isError, "FAIL" as const];
        return [isError, "FETCH_DONE" as const];
    });

    return {
        getIdsMissingFoodWithNutrients,
        getFoodWithParams,
        getOne,
        getOneByDate,
        _loadFoodWithNutrientsByFoodIds,
        loadFoodWithNutrientsByFoodIds,
    };
})

export type FoodStoreInstance = Instance<typeof FoodModelStore>
