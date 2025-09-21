import { CollectionItemEntityStatusUI } from "@/components/blocks/builders/food/shared/UpdateChildrenStore";

export type NoId<T extends { id: unknown }> = Omit<T, "id">;

export function noChildrenIds<T extends { id: unknown }>(
    data: T[]
): NoId<T>[] {
    return data.map(({ id, ...rest }) => rest);
}

type NoIdIfString<T> = T extends { id: string | number } ? Omit<T, "id"> : T;

export function noChildrenIdsIfString<T extends { id: unknown }>(
    data: T[]
): NoIdIfString<T>[] {
    return data.map(({ id, ...rest }) => {
        if (typeof id === "string") {
            return rest as NoIdIfString<T>;
        }
        return { id, ...rest } as NoIdIfString<T>;
    });
}

// export function removeStatusPropertyAndFilterByUIStatus<T extends { status: CollectionItemEntityStatusUI }>(
//     data: T[]
// ): Omit<T, 'status'>[] {
//     return data.filter(({ status, ...rest }) => {
//         if (status === "deleted") {
//             return false
//         }
//         return { ...rest }
//     });
// }

export function filterAndRemoveStatus<T extends { status: CollectionItemEntityStatusUI }>(
    data: T[]
): Omit<T, 'status'>[] {
    const result: Omit<T, 'status'>[] = [];
    for (const item of data) {
        if (item.status !== "deleted") {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { status, ...rest } = item;
            result.push(rest);
        }
    }
    return result;
}