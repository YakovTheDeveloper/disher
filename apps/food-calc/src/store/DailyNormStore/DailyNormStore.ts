import { types, Instance, SnapshotIn } from "mobx-state-tree";
import { DailyNorm, UserDailyNorm } from "@/domain/dailyNorm/DailyNorm.model";
import { RequestAndSetHandler } from "@/store/common/pureFabrication/RequestAndSet";
import { StatusModel } from "@/store/common/pureFabrication/StatusModel";
import {
    getDailyNorms,
    createDailyNorm,
    updateDailyNorm,
    removeDailyNorm,
} from "@/api/dailyNorm/dailyNorm.api";
import { runInAction } from "mobx";
import { DailyNormEntity } from "@/store/models/dailyNorm/dailyNorm.types";
import { DailyNormFactory } from "@/store/DailyNormStore/factory";
import { defaultDailyNorm } from "@/store/DailyNormStore/data";

export const DailyNormStore = types
    .model("DailyNormStore", {
        data: types.map(DailyNorm),
        userData: types.map(UserDailyNorm),
        selectedNormId: types.maybeNull(types.string),
        status: types.optional(StatusModel, {
            fetchGet: {},
            fetchSync: {},
        }),
    })
    .views((self) => ({
        get predefinedDataList(): Instance<typeof DailyNorm>[] {
            return Array.from(self.data.values());
        },
        get userDataList(): Instance<typeof DailyNorm>[] {
            return Array.from(self.userData.values());
        },
    }))
    .actions((self) => ({

        addNewLocal(payload: Omit<SnapshotIn<typeof DailyNorm>, 'id'>) {
            const model = DailyNormFactory.createNewLocal(payload)
            self.userData.set(model.id, model);
            return model
        },

        addLocalFromServer(payload: SnapshotIn<typeof DailyNorm>) {
            const model = DailyNormFactory.createFromServerData(payload)
            self.userData.set(model.id, model);
            return model
        },

        getUserDailtNormById(id: string): Instance<typeof UserDailyNorm> | undefined {
            return self.userData.get(id);
        },

        getAll: async () => {
            const requestHandler = new RequestAndSetHandler(self);
            const result = await requestHandler.load(
                [{ id: "all", variant: "fetchGet" }],
                () => getDailyNorms()
            );

            if (result?.data) {
                runInAction(() => {
                    result.data.forEach((norm) => {
                        self.userData.set(norm.id.toString(), DailyNorm.create(norm as any));
                    });
                });
            }
        },

        create: async (payload: Omit<DailyNormEntity, "id">) => {
            const requestHandler = new RequestAndSetHandler(self);
            const result = await requestHandler.load(
                [{ id: "create", variant: "fetchSync" }],
                () => createDailyNorm(payload as any)
            );

            if (result?.data) {
                runInAction(() => {
                    self.userData.set(result.data.id.toString(), DailyNorm.create(result.data as any));
                });
            }
        },

        fetchUpdate: async (id: number, payload: DailyNormEntity) => {
            const requestHandler = new RequestAndSetHandler(self);
            const result = await requestHandler.load(
                [{ id, variant: "fetchSync" }],
                () => updateDailyNorm(payload as any)
            );

            if (result?.data) {
                runInAction(() => {
                    self.userData.set(result.data.id.toString(), DailyNorm.create(result.data as any));
                });
            }
        },

        fetchRemove: async (id: number) => {
            const requestHandler = new RequestAndSetHandler(self);
            const result = await requestHandler.load(
                [{ id, variant: "fetchSync" }],
                () => removeDailyNorm(id)
            );

            if (result !== null) { // assuming success if not null
                runInAction(() => {
                    self.userData.delete(id.toString());
                });
            }
        },

        afterCreate() {
            const defaultNorm = DailyNormFactory.createPredefined(defaultDailyNorm)
            self.data.set(defaultNorm.id, defaultNorm)
        }
    }));

export type DailyNormStoreInstance = Instance<typeof DailyNormStore>
