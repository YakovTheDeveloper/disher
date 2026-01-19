import { types, Instance } from "mobx-state-tree";
import { RequestState } from "@/store/shared/RequestState";
import { UserDailyNorm } from "@/domain/dailyNorm/DailyNorm.model";
import { StatusModel } from "@/store/common/pureFabrication/StatusModel";
import { createDataStoreModel } from "@/store/shared/DataStore";

const storeModel = types.model("DailyNormStore", {
    request: types.map(RequestState),
    status: types.optional(StatusModel, {}),
});

const dataStoreModel = createDataStoreModel(
    "DailyNormData",
    UserDailyNorm
);

const optionsModel = types.model("DailyNormOptions", {
    selectedNormId: types.maybeNull(types.string),
}).actions(self => ({
    setSelectedId(id: string) {
        self.selectedNormId = id
    },
}));

export const DailyNormStore = types.compose(
    "DailyNormStore",
    storeModel,
    dataStoreModel,
    optionsModel
);

export type DailyNormStoreInstance = Instance<typeof DailyNormStore>
