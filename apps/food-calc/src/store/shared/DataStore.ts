import { IAnyModelType, Instance, SnapshotIn, types } from "mobx-state-tree";

export function DataStoreController<TModel extends IAnyModelType>(Model: TModel) {
    return types
        .model({
            base: types.optional(types.map(Model), {}),
            user: types.optional(types.map(Model), {}),
        })

        .views((self) => ({
            getEntity(id: string): Instance<TModel> | undefined {
                return self.user.get(id) ?? self.base.get(id);
            },

            get merged(): Instance<TModel>[] {
                return [...self.base.values(), ...self.user.values()];
            },

            get size() {
                return self.base.size + self.user.size;
            },

            has(id: string) {
                return self.user.has(id) || self.base.has(id);
            },
        }))

        .actions((self) => ({
            seedBase(items: Record<string, Instance<TModel>>) {
                if (!items || typeof items !== 'object') return;
                self.base.replace(new Map(Object.entries(items)));
            },

            insert(entity: Instance<TModel>) {
                const id = (entity as any).id.toString();
                self.user.set(id, entity);
                return entity;
            },

            set(id: string, value: Instance<TModel> | SnapshotIn<TModel>) {
                self.user.set(id, value as Instance<TModel>);
            },

            removeBulk(ids: string[]) {
                ids.forEach(id => self.user.delete(id));
            },
        }));
}

export type IDataStoreInstance<
    TBase extends IAnyModelType = IAnyModelType,
> = Instance<ReturnType<typeof DataStoreController<TBase>>>;
