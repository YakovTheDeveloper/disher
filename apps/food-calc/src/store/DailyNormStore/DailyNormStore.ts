import { types, Instance, SnapshotIn } from "mobx-state-tree";
import { RequestState } from "@/store/shared/RequestState";
import { DailyNorm, DailyNormItem } from "@/domain/dailyNorm/DailyNorm.model";
import { StatusModel } from "@/store/common/pureFabrication/StatusModel";
import { createDataStoreModel } from "@/store/shared/DataStore";
import { DailyNormsFactory } from "@/domain/dailyNorm/factory";
import { defaultDailyNorms } from "@/components/features/builders/TotalNutrients/Nutrients/constants";

const dataStoreModel = createDataStoreModel(
    "DailyNormData",
    DailyNorm,
);

// const optionsModel = types.model("DailyNormOptions", {
//     selectedNormId: types.maybeNull(types.string),
// }).actions(self => ({
//     setSelectedId(id: string) {
//         self.selectedNormId = id
//     },
// }));

export const DailyNormStore = dataStoreModel
    .props({
        selectedNormId: types.maybeNull(types.string),
        request: types.map(RequestState),
        status: types.optional(StatusModel, {}),
    })
    .actions((self => ({
        applySeed() {

            const items: SnapshotIn<typeof DailyNormItem>[] = Object.entries(defaultDailyNorms).map(([nutrientId, quantity], index) => ({
                id: (index + 1).toString(),
                nutrientId: nutrientId.toString(),
                quantity
            }));

            const norm1 = DailyNormsFactory.createFromServerData({
                name: 'Стандарт',
                description: 'Стандартная норма потребления, для среднестатистического человека',
                id: 'DEFAULT_NORM',
                items,
                createByUser: false
            })
            const result = {
                [norm1.id]: norm1
            }

            self.base.set(result)
        },
        setSelectedId(id: string) {
            self.selectedNormId = id
        },
    })));

export type DailyNormStoreInstance = Instance<typeof DailyNormStore>
