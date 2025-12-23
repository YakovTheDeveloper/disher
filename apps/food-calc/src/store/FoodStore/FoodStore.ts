import { types, flow, getSnapshot, Instance, SnapshotIn } from "mobx-state-tree";
import { getFoodList, GetFoodParams, getFoodWithNutrients, getFoodWithNutrientsByIds, getOneFood } from "@/api/food/food.api";
import { requestWrapper } from "@/api/Request";
import { RequestState, ResponseStatus } from "@/api/RequestState";
import { isEmpty } from "@/lib/empty";
import { Food } from "@/domain/Food";
import { createFoodModel } from "@/store/FoodStore/factory";
import { runInAction } from "mobx";
import { standardFood } from "@/assets/seed/food";

type GetFoodListResult = Awaited<ReturnType<typeof getFoodList>>;
type GetFoodNutrientsByIdResult = Awaited<ReturnType<typeof getFoodWithNutrientsByIds>>;
//
// TYPES
//
//
// STORE
//
export const FoodModelStore = types
    .model("FoodModelStore", {
        data: types.map(Food),
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

        function setShortData(data: any[]) {
            self.shortData.push(...data);
        }

        function addLocal(value: SnapshotIn<typeof Food>) {
            // const model = createFoodModel(value);
            const model = Food.create(value);
            try {
                self.data.set(model.id, model);
            } catch (error) {
                // handle error if needed
            }
            return model;
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

        const addFoodIfNotExists = (food) => {
            if (!self.data.has(food.id)) {
                self.data.set(food.id, food)
            }
        }

        const loadInitialFoods = () => {
            standardFood.forEach(food => {
                addFoodIfNotExists(food)
            })
        }

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
                items.forEach(item => addLocal(item));
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
            afterCreate() {
                loadInitialFoods()
            }
        };
    });

//
// INSTANCE TYPE
//
export interface IFoodModelStore extends Instance<typeof FoodModelStore> { }
