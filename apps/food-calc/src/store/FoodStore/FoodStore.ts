import { types, flow, Instance, SnapshotIn } from "mobx-state-tree";
import { getFoodList, GetFoodParams, getFoodWithNutrients, getFoodWithNutrientsByIds, getOneFood } from "@/api/food/food.api";
import { RequestState, ResponseStatus } from "@/api/RequestState";
import { isEmpty } from "@/lib/empty";
import { Food, UserFood } from "@/domain/Food";
import { runInAction } from "mobx";
import foodFullData from "@/assets/seed/foodFull.json";
import { generateId } from "@/lib/id/generateId";

type GetFoodListResult = Awaited<ReturnType<typeof getFoodList>>;
type GetFoodNutrientsByIdResult = Awaited<ReturnType<typeof getFoodWithNutrientsByIds>>;
type AddLocalPayload = {
    food: SnapshotIn<typeof Food>,
    variant: 'pre-defined-food'
} | {
    food: Omit<SnapshotIn<typeof Food>, 'id'>,
    variant: 'user-custom-food'
}

//
// TYPES
//
//
// STORE
//

function normalizeNutrients(
    nutrients?: SnapshotIn<typeof Food>['nutrients']
) {
    return nutrients?.map((n: any) => ({
        ...n,
        nutrient: n.nutrientId ?? n.nutrient,
    }))
}

export const FoodModelStore = types
    .model("FoodModelStore", {
        data: types.map(Food),
        customUserFoodData: types.map(UserFood),
        shortData: types.optional(types.array(Food), []),
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

    //
    // VIEWS
    //
    .views((self) => ({
        get list() {
            return Array.from(self.data.values());
        },
        get dataLength() {
            return self.data.size
        },
        isOneOfProductsIsLoading(foodIds: string[]) {
            const entries = Array.from(self.requestState.getAllWithNutrients.keys());
            return entries.some((key) =>
                foodIds.some((key2) => key === key2.toString())
            )
        }
    }))

    //
    // ACTIONS
    //
    .actions((self) => {

        function getUserFoodById(id: string) {
            return self.customUserFoodData.get(id)
        }

        function getUserOrPredefinedFoodById(id: string) {
            return self.customUserFoodData.get(id) || self.data.get(id)
        }

        function setShortData(data: any[]) {
            self.shortData.push(...data);
        }

        function addLocal(payload: AddLocalPayload): Instance<typeof Food> | undefined {
            try {
                switch (payload.variant) {
                    case 'pre-defined-food': {
                        const model = Food.create({
                            ...payload.food,
                            nutrients: normalizeNutrients(payload.food.nutrients),
                        })

                        self.data.set(model.id, model)
                        return model
                    }

                    case 'user-custom-food': {
                        const model = Food.create({
                            ...payload.food,
                            id: generateId(),
                            nutrients: normalizeNutrients(payload.food.nutrients),
                        })

                        self.customUserFoodData.set(model.id, model)
                        return model
                    }

                    default: {
                        const _exhaustive: never = payload
                        return _exhaustive
                    }
                }
            } catch (error) {
                // optionally log / rethrow
                console.error('addLocal failed', error)
                return undefined
            }
        }

        function deleteFood(id: number) {
            self.data.delete(String(id));
        }

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
            const existFood = self.data.get(key)
            1
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
                    runInAction(() => self.data.set(key, newFood))
                    return
                }

                if (isEmpty(existFood?.nutrients)) {
                    existFood.setNutrients(food.nutrients)
                }
            } catch (error) {
                console.error(error)
            }

        }

        const loadInitialFoods = flow(function* (): Generator<any> {
            const data = yield fetch('/foodFull.json').then(r => r.json());
            foodFullData.forEach(food => {
                addFoodOrNutrientsIfNotExists(food)
            })
        });

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

        const loadLazy = flow(async function (params) {

            // Calculate how many we already have
            const loadedCount = self.data.size;

            // --- SMART SKIP LOGIC ---
            // If server data is static and:
            //    - we know total already
            //    - we have all items
            //    - AND fetch is beginning from start
            if (
                params?.offset === 0 &&
                self.total > 0 &&
                loadedCount === self.total
            ) {
                // Nothing to load
                return;
            }

            const result = await getFoodWithNutrients(params);
            if (!result?.data) return;

            const { hasMore, items, total } = result.data;

            runInAction(() => {
                // update totals
                self.total = total;
                self.hasMore = hasMore;

                // add new items
                items.forEach(item => addLocal({
                    food: item,
                    variant: 'pre-defined-food'
                }));
            });
        });

        return {
            setShortData,
            addLocal,
            deleteFood,
            getIdsMissingFoodWithNutrients,
            getFoodWithParams,
            getOne,
            getOneByDate,
            _loadFoodWithNutrientsByFoodIds,
            loadFoodWithNutrientsByFoodIds,
            loadLazy,
            getUserFoodById,
            getUserOrPredefinedFoodById,
            afterCreate() {
                loadInitialFoods()
            }
        };
    });

//
// INSTANCE TYPE
//
export interface FoodStoreInstance extends Instance<typeof FoodModelStore> { }
