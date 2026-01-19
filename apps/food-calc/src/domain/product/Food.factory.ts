import { Food } from "@/domain/product/Food.model"
import { generateId } from "@/lib/id/generateId"
import { StoreEntityFactory } from "@/store/types/factory"
import { SnapshotIn } from "mobx-state-tree"

export const productFactory: StoreEntityFactory<typeof Food> = {
    createNewLocal(data: Omit<SnapshotIn<typeof Food>, 'id'>) {
        try {
            return Food.create({
                ...data,
                id: generateId(),
                nutrients: normalizeNutrients(data.nutrients),
                createdByUser: true
            });
        } catch (error) {
            console.error('createNewLocal failed', error);
            throw error;
        }
    },
    createFromServerData(data: SnapshotIn<typeof Food>) {
        try {
            return Food.create({
                ...data,
                nutrients: normalizeNutrients(data.nutrients),
            });
        } catch (error) {
            console.error('createFromServerData failed', error);
            throw error;
        }
    }
};

function normalizeNutrients(
    nutrients?: SnapshotIn<typeof Food>['nutrients']
) {
    return nutrients?.map((n: any) => ({
        ...n,
        nutrient: n.nutrientId ?? n.nutrient,
    }));
}
