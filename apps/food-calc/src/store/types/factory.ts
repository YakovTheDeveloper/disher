import { IAnyModelType, Instance, SnapshotIn } from "mobx-state-tree";

export interface StoreEntityFactory<ModelType extends IAnyModelType, S = SnapshotIn<ModelType>> {
    createNewLocal(data: Omit<S, 'id'>): Instance<ModelType>;
    createFromServerData(data: S): Instance<ModelType>;
}
