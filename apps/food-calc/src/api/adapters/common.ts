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

export type DayScheduleItemUIStatus = 'added' | 'deleted' | 'modified' | null

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

export interface ScheduleChanges<T extends { id: number | string, status: string | null }> {
    create: Omit<T, 'status' | 'id'>[];
    update: (Omit<T, 'status' | 'id'> & { id: number })[];
    delete: number[]; // ids
}

export function extractChanges<T extends { id: number | string, status: string | null }>(items: T[]): ScheduleChanges<T> {
    const create: Omit<T, 'status' | 'id'>[] = [];
    const update: Omit<T, 'status'>[] = [];
    const deleteIds: number[] = [];

    for (const item of items) {
        switch (item.status) {
            case 'added':
                // no id yet
                const { status: _, id: __, ...newItem } = item;
                create.push(newItem);
                break;
            case 'modified':
                const { status: _s, ...changedItem } = item;
                update.push(changedItem);
                break;
            case 'deleted':
                if (item.id) deleteIds.push(item.id);
                break;
            default:
                break; // unchanged
        }
    }

    return { create, update, delete: deleteIds };
}