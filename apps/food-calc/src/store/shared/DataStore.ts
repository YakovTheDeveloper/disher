import { StatusModel } from "@/store/common/pureFabrication/StatusModel";
import { IAnyModelType, Instance, SnapshotIn, types } from "mobx-state-tree";

export function createEntityDataStore<TModel extends IAnyModelType>(name: string, model: TModel) {
    return types
        .model(name, {
            entities: types.optional(types.map(model), {}),
            status: types.optional(StatusModel, {}),
            meta: types.map(
                types.model({
                    status: types.enumeration([
                        "new",
                        "dirty",
                        "synced",
                        "deleted",
                    ]),
                    updatedAt: types.number,
                })
            ),
        })

        .views((self) => ({
            get list(): Instance<TModel>[] {
                return Array.from(self.entities.values()).filter(
                    (e) => self.meta.get((e as any).id)?.status !== "deleted"
                );
            },
            getById(id: string) {
                return self.entities.get(id);
            },
        }))

        .actions((self) => ({
            insert(entity: Instance<TModel>, status: "new" | "synced" = "new") {
                const id = (entity as any).id.toString();

                self.entities.set(id, entity);
                self.meta.set(id, {
                    status,
                    updatedAt: Date.now(),
                });
                return entity
            },

            removeBulk(idList: string[]) {
                idList.forEach(id => {
                    self.entities.delete(id);
                });
            },

            replace(entity: Instance<TModel>) {
                const id = (entity as any).id.toString();
                self.entities.set(id, entity);
                self.meta.get(id)!.status = "dirty";
                self.meta.get(id)!.updatedAt = Date.now();
            },

            markDeleted(id: string) {
                const meta = self.meta.get(id);
                if (!meta) return;

                meta.status = "deleted";
                meta.updatedAt = Date.now();
            },

            markSynced(id: string) {
                const meta = self.meta.get(id);
                if (!meta) return;

                meta.status = "synced";
            },

        }));
}

export function createImmutableEntityStore<TModel extends IAnyModelType>(name: string, model: TModel, getInitDataAfterStoreCreate?: () => Promise<Record<string, SnapshotIn<TModel>>>) {
    return types
        .model(name, {
            entities: types.optional(types.map(model), {}),
        })
        .views((self) => ({
            get list(): Instance<TModel>[] {
                return Array.from(self.entities.values());
            },
            getById(id: string) {
                return self.entities.get(id);
            },
        }))
        .actions((self) => ({
            load(items: Instance<TModel>[]) {
                self.entities.clear();
                items.forEach((item) => {
                    self.entities.set((item as any).id.toString(), item);
                });
            },
            afterCreate() {
                if (getInitDataAfterStoreCreate) {
                    getInitDataAfterStoreCreate().then((init: Record<string, SnapshotIn<TModel>>) => {

                        console.log("init from afterCreate", init);

                        for (const [id, snapshot] of Object.entries(init)) {
                            const instance = model.create(snapshot);
                            self.entities.set(id, instance);
                        }
                    }).finally(() => {
                        Object.freeze(self.entities);
                    });
                } else {
                    Object.freeze(self.entities);
                }
            },
        }));
}

export function createDataStoreModel<
    TBaseModel extends IAnyModelType,
>(
    name: string,
    model: TBaseModel,
    getInitDataAfterStoreCreate?: () => Promise<Record<string, SnapshotIn<TBaseModel>>>
) {
    const BaseStore = createImmutableEntityStore(
        name + "Base",
        model,
        getInitDataAfterStoreCreate
    );

    const UserStore = createEntityDataStore(
        name + "User",
        model
    );

    return types
        .model(name, {
            base: types.optional(BaseStore, {}),
            user: types.optional(UserStore, {}),
        })

        .views(self => ({
            get merged(): (Instance<TBaseModel>)[] {
                return [...self.base.list, ...self.user.list]
            },

            get mergedMap(): Map<
                string,
                Instance<TBaseModel>
            > {
                const map = new Map<
                    string,
                    Instance<TBaseModel>
                >()

                for (const [id, entity] of self.base.entities) {
                    map.set(id as string, entity)
                }

                self.user.entities.forEach((entity, id) => {
                    const meta = self.user.meta.get(id)
                    if (meta?.status !== "deleted") {
                        map.set(id.toString(), entity)
                    }
                })

                return map
            },

        }))

        .views(self => ({
            get size() {
                return self.mergedMap.size
            },
            getEntity(id: string) {
                return self.mergedMap.get(id)
            },

        }))

}

// export type DataStoreType = ReturnType<typeof createDataStoreModel>

export type IDataStoreInstance<
    TBase extends IAnyModelType = IAnyModelType,
> = Instance<ReturnType<typeof createDataStoreModel<TBase>>>;

// TODO - убрать разделение на две сущности, пусть будет одна с флагом origin or createdByUser> = Instance<ReturnType<typeof createDataStoreModel<TBase>>>;
