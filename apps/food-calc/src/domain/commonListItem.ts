import { types } from "mobx-state-tree";

export const ItemStatus = types.enumeration([
    "added",
    "modified",
    "deleted",
    "none"
]);

export type ItemStatusType = "added" | "modified" | "deleted" | "none";