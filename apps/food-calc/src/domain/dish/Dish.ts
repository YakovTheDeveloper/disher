import { ItemStatus } from "@/domain/commonListItem";
import { Food } from "@/domain/Food";
import { getParent, getRoot, Instance, types } from "mobx-state-tree";

export const DishItem = types.model("DishItem", {
    id: types.identifierNumber,
    quantity: types.number,
    foodId: types.string,
    food: types.reference(Food, {
        get(identifier, parent) {
            const root = getRoot(parent); // <-- MST helper to get the tree root
            return root.foodStore.data.get(identifier);
        },
        set(value) {
            return value.id; // MST needs to know how to store reference
        }
    }),
    status: types.optional(ItemStatus, "none")
}).actions(self => ({
    setAsCurrent() {
        const parent = getParent<Instance<typeof Dish>>(self, 2);
        console.log("parent", parent);
        parent.setCurrent(self.id);
    },
    markModified() {
        if (self.status === "none") {
            self.status = "modified";
        }
    },
    markDeleted() {
        self.status = "deleted";
    },
    recover() {
        if (self.status === "deleted") {
            self.status = "none";
        }
    }
}))

// Dish
export const Dish = types.model("Dish", {
    id: types.identifier,
    name: types.string,
    userId: types.number,
    items: types.array(types.late(() => DishItem)),
    isDraft: types.boolean,
    currentId: types.optional(types.number, -1)
}).views(self => ({
    get current() {
        return self.items.find(i => i.id === self.currentId) || null;
    },
    get itemsLength() {
        return self.items.length
    },
    get currentMode() {
        return self.currentId === -1 ? 'ADD' : 'UPDATE'
    },
    get isNoItems() {
        return self.items.length === 0
    }

}))
    .actions(self => ({
        setCurrent(id: number) {
            self.currentId = id;
        },
        addOrUpdateChild(foodId: string, fields: Partial<typeof DishItem> = {}) {
            if (self.currentMode === 'ADD') {
                const item = DishItem.create({
                    id: Date.now(),
                    quantity: 100,
                    foodId,
                    food: foodId,
                    status: "added",
                    ...fields
                });
                self.items.push(item);
                return item;
            } else if (self.currentMode === 'UPDATE' && self.current) {
                Object.assign(self.current, { foodId, food: foodId, ...fields });
                self.current.markModified();
                return self.current;
            }
        },

        updateName(name: string) {
            self.name = name
        },

        updateQuantity(quantity: number) {
            self.updateCurrentChild({ quantity })
        },

        updateCurrentChild(fields: Partial<typeof DishItem>) {
            const item = self.current;
            if (!item) return;

            Object.assign(item, fields);
            item.markModified();
        },

        deleteItem(childId: number) {
            const item = self.items.find(i => i.id === childId);
            if (!item) return;

            if (item.status === "added") {
                // completely remove if it's never been saved
                self.items.replace(self.items.filter(i => i.id !== childId));
                return;
            }

            // soft delete
            item.markDeleted();
        },

        recoverItem(childId: number) {
            const item = self.items.find(i => i.id === childId);
            if (!item) return;
            item.recover();
        }
    }));