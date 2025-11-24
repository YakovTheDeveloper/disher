import { types, flow, getSnapshot, Instance } from "mobx-state-tree";
import { getFoodList, GetFoodParams, getFoodWithNutrients, getOneFood } from "@/api/food/food.api";
import { requestWrapper } from "@/api/Request";
import { RequestState } from "@/api/RequestState";
import { isEmpty } from "@/lib/empty";
import { Food } from "@/domain/Food";
import { createFoodModel } from "@/store/FoodStore/factory";

type GetFoodListResult = Awaited<ReturnType<typeof getFoodList>>;
//
// TYPES
//
//
// STORE
//
export const FoodModelStore = types
    .model("FoodModelStore", {
        data: types.map(Food),
        data2: types.array(Food),
        shortData: types.optional(types.array(Food), []),

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
    }))

    //
    // ACTIONS
    //
    .actions((self) => ({

        setShortData(data: any[]) {
            self.shortData.push(...data);
        },

        // set(id: number, value: any) {
        //     self.data.set(String(id), value);
        // },

        addLocal(value: Partial<Instance<typeof Food>>) {
            const model = createFoodModel(value)
            self.data.set(model.id, model);
            return model
        },

        delete(id: number) {
            self.data.delete(String(id));
        },

        getIdsMissingFoodWithNutrients(ids: number[]) {
            const missing: number[] = [];
            ids.forEach((id) => {
                const exist = self.data.get(String(id));
                if (!exist || !exist.nutrients) missing.push(id);
            });
            return missing;
        },

        //
        // LOAD FOOD LIST
        //
        getFoodWithParams: flow(function* (params: GetFoodParams) {
            const result: GetFoodListResult = yield getFoodList(params);

            console.log('result', result)
            if (!result?.data) return { items: [], hasMore: false };

            result.data.items.forEach((food) => {
                console.log('result food', food)

                self.data.set(food.id.toString(), {
                    ...food,
                    id: food.id.toString()
                });
                self.data2.push({
                    ...food,
                    id: food.id.toString()
                });
            });

            console.log('FOODSTORE self.data', self.data);

            return result.data;
        }),

        //
        // LOAD ONE FOOD
        //
        getOne: flow(function* (id: number) {
            const res = yield getOneFood(id);
            if (!res.data) return;
            self.data.set(String(res.data.id), res.data);
        }),

        //
        // LOAD ONE FOOD by date (your function was wrong — you used id inside)
        //
        getOneByDate: flow(function* (date: number) {
            const res = yield getOneFood(date); // assuming same API
            if (!res.data) return;
            self.data.set(String(res.data.id), res.data);
        }),

        //
        // PRIVATE: LOAD FOOD WITH NUTRIENTS
        //
        _loadFoodWithNutrientsByFoodIds: flow(function* (ids: number[]) {
            const state = new RequestState("");

            ids.forEach((id) => {
                self.requestState.getAllWithNutrients.set(String(id), state);
            });

            const res = yield requestWrapper(getFoodWithNutrients, {}, ids);

            if (!res.data) {
                state.fail("error");
                ids.forEach((id) =>
                    self.requestState.getAllWithNutrients.delete(String(id))
                );
                return state.data();
            }

            state.success();
            ids.forEach((id) =>
                self.requestState.getAllWithNutrients.delete(String(id))
            );

            res.data.forEach((dish: any) => {
                self.data.set(String(dish.id), dish);
            });

            return state.data();
        }),

        //
        // PUBLIC: LOAD WITH MISSING CHECK
        //
        loadFoodWithNutrientsByFoodIds: flow(function* (ids: number[]) {
            ids = self.getIdsMissingFoodWithNutrients(ids);
            if (isEmpty(ids)) return [false, "NO_FETCH_NEEDED" as const];

            const [isError] = yield self._loadFoodWithNutrientsByFoodIds(ids);

            if (isError) return [isError, "FAIL" as const];
            return [isError, "FETCH_DONE" as const];
        }),
    }));

//
// INSTANCE TYPE
//
export interface IFoodModelStore extends Instance<typeof FoodModelStore> { }
