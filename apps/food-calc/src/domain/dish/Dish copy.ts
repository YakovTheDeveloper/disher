import { deleteChild as deleteChildFromList, ItemStatus, ItemStatusType, SyncStatus } from "@/domain/commonListItem";
import { Food } from "@/domain/Food";
import { ChildrenController } from "@/domain/shared/ChildrenController";
import { generateId } from "@/lib/id/generateId";
import { sumRecordArray, sumRecords } from "@/lib/sumRecords/sumRecords";
import { destroy, getParent, getRoot, Instance, SnapshotIn, types } from "mobx-state-tree";

export const DishItem = types.model("DishItem", {
    id: types.identifier,
    quantity: types.number,
    foodId: types.string,
    food: types.reference(Food, {
        get(identifier, parent) {
            const root = getRoot(parent); // <-- MST helper to get the tree root
            console.log("root", root);
            return root.foodStore?.data.get(identifier);
        },
        set(value) {
            return value.id; // MST needs to know how to store reference
        }
    }),
    sync: types.optional(SyncStatus, {})
}).actions(self => ({
    deleteChild() {
        const parent = getParent<Instance<typeof Dish>>(self, 2);
        parent.deleteChild(self.id);
    },
    update(
        fields: Partial<SnapshotIn<typeof DishItem>>) {
        const parent = getParent<Instance<typeof Dish>>(self, 2);
        parent.updateChildById(self.id, fields, true);
    }
}))

// Dish
export const Dish = types.compose("Dish", types.model({
    id: types.identifier,
    name: types.string,
    userId: types.number,
}), ChildrenController(DishItem))
    .views(self => ({
        get delta() {
            console.log(self.items);
            const added = self.items.filter(i => i.sync.status === "added");
            const modified = self.items.filter(i => i.sync.status === "modified");
            const deleted = self.items.filter(i => i.sync.status === "deleted").map(({ id }) => id);

            return { added, modified, deleted };
        },
        get itemsLength() {
            return self.items.length
        },
        get isNoItems() {
            return self.items.length === 0
        },
        get baseDishWeight() {
            return self.items.reduce(
                (sum, { quantity }) => sum + quantity,
                0
            );
        }
    })).views(self => ({

        get foodWithNoNutrients() {
            return Array.from(new Set(self.items.filter(item => item.food.noNutrients).map(item => item.food)))
        }
    }))
    .actions(self => {

        function addOrUpdateBulk(inputChildren: {
            id: string;
            quantity: number;
            foodId: number;
        }[]) {
            for (const dishChild of inputChildren) {
                const { id, quantity, foodId } = dishChild
                const localChild = updateChildById(id, {
                    quantity, foodId: foodId.toString()
                }, false)
                localChild?.sync.onSync(Date.now().toString())
                if (!localChild) {
                    addChildWithServerData(foodId.toString(), { id, quantity })
                }
            }
        }

        function getTotalNutrients(userQuantity: number) {
            const nutrients = self.items.map(({ food }) => food.getTotalNutrients(userQuantity));
            const acc = sumRecordArray(nutrients)
            const scaleFactor = userQuantity / self.baseDishWeight;
            Object.keys(acc).forEach(key => {
                acc[key] = acc[key] * scaleFactor;
            });
            return acc;
        }

        function addChildWithLocalData(foodId: string, fields: Partial<typeof DishItem> = {}) {
            const item = DishItem.create({
                id: generateId(),
                quantity: 100,
                foodId,
                food: foodId,
                ...fields
            });
            item.sync.markAdded()
            self.items.push(item);
            return item;
        }

        function addChildWithServerData(foodId: string, fields: Partial<typeof DishItem> & { id: string, quantity: number }) {
            const item = DishItem.create({
                foodId,
                food: foodId,
                ...fields
            });
            self.items.push(item);
            return item;
        }

        function getChildById(childId: string) {
            const child = self.items.find(({ id }) => id === childId);
            return child
        }

        function updateChildById(
            childId: string,
            fields: Partial<SnapshotIn<typeof DishItem>>,
            markChildAsModified?: boolean
        ) {
            const child = self.items.find(({ id }) => id === childId);
            if (!child) return;

            Object.assign(child, {
                ...fields,
                ...(fields.foodId !== undefined
                    ? { foodId: fields.foodId, food: fields.foodId }
                    : {})
            })

            if (markChildAsModified) child.sync.markModified();
            return child;
        }

        function updateName(name: string) {
            self.name = name;
        }

        function deleteChild(childId: string) {
            deleteChildFromList(self.items, childId)
        }

        function removeChildrenMarkedAsDeleted() {
            self.items
                .filter(item => item.sync.status === 'deleted')
                .forEach(item => {
                    destroy(item);
                });
        }
        return {
            addChildWithLocalData,
            addChildWithServerData,
            updateChildById,
            addOrUpdateBulk,
            getChildById,
            getTotalNutrients,
            updateName,
            deleteChild,
            removeChildrenMarkedAsDeleted
        };
    })
