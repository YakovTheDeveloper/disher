// import { FoodWithQuantity } from "@/domain/schedule/types";
// import { getParent, getRoot, types } from "mobx-state-tree";

// export const FoodItemContent = types.model()
//     .named("FoodItemContent")
//     .props({
//         type: types.literal("food"),
//         foodId: types.string,
//         food: types.reference(Food, {
//             get(identifier, parent) {
//                 const root = getRoot(parent); // <-- MST helper to get the tree root
//                 return root.foodStore.data.get(identifier);
//             },
//             set(value) {
//                 return value.id; // MST needs to know how to store reference
//             }
//         }),
//     })
//     .views((self) => ({
//         get name() { return self.food?.name || 'нет имени' },
//         get parentQuantity(): number {
//             const parentItem = getParent(self);
//             return parentItem.quantity;
//         }

//     })).actions(self => {

//         function getProductTotalQuantity(customQuantity?: number): FoodWithQuantity[] {
//             const quantity = customQuantity ?? self.parentQuantity;
//             return [{
//                 id: self.food.id,
//                 quantity
//             }]
//         }

//         return {
//             getProductTotalQuantity
//         }
//     })
