import { types, Instance, SnapshotIn } from "mobx-state-tree";
import { RequestState } from "@/store/shared/RequestState";
import { DailyNorm, DailyNormItem } from "@/domain/dailyNorm/DailyNorm.model";
import { StatusModel } from "@/store/common/pureFabrication/StatusModel";
import { createDataStoreModel } from "@/store/shared/DataStore";
import { DailyNormsFactory } from "@/domain/dailyNorm/factory";
import { defaultDailyNorms } from "@/components/features/builders/food/shared/ContentInfo/Nutrients/constants";

const storeModel = types.model("DailyNormStore", {
    request: types.map(RequestState),
    status: types.optional(StatusModel, {}),
});

const dataStoreModel = createDataStoreModel(
    "DailyNormData",
    DailyNorm,
    onInit
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

// function onInit(): Record<string, SnapshotIn<typeof DailyNorm>> {
async function onInit(): Promise<Record<string, Instance<typeof DailyNorm>>> {

    const items: SnapshotIn<typeof DailyNormItem>[] = Object.entries(defaultDailyNorms).map(([nutrientId, quantity], index) => ({
        id: (index + 1).toString(),
        nutrientId: nutrientId.toString(),
        quantity
    }));

    const norm1 = DailyNormsFactory.createFromServerData({
        name: 'Стандарт',
        description: '',
        id: 'DEFAULT_NORM',
        items,
        createByUser: false
    })
    const result = {
        [norm1.id]: norm1
    }
    return result
}