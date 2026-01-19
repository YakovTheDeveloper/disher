import { SnapshotIn } from "mobx-state-tree";
import { Food } from "@/domain/product/Food.model";
import { productFactory } from "@/domain/product/Food.factory";

export async function createInitialProductMapping(): Promise<Record<string, SnapshotIn<typeof Food>>> {

    interface FoodEntry {
        id: string;
        name: string;
        description: string;
        nutrients: {
            nutrientId: string;
            quantity: number;
        }[];
    }

    const rawData: FoodEntry[] = await fetch('/foodFull.json').then(r => r.json());

    const data: Record<string, SnapshotIn<typeof Food>> = {};
    rawData.forEach(item => {

        const nutrients = item.nutrients?.map((n) => ({
            ...n,
            nutrient: n.nutrientId
        }));

        const seed = productFactory.createFromServerData({
            ...item,
            nutrients
        })
        if (!seed) return
    });

    console.log('init from createInitialProductMapping', data);

    return data
}
