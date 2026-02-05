import { types, Instance, SnapshotIn } from "mobx-state-tree";
import { ModalType } from "./ModalContent";
import {
    WizardModal,
    GetPayload,
    DishEditPayloadModel,
    DishCreatePayloadModel,
    ScheduleFoodEditPayloadModel,
    ScheduleFoodAddPayloadModel,
    ScheduleEventEditPayloadModel,
    ScheduleEventAddPayloadModel,
} from "./ModalPayloads";

// Union of all payload models for storage
const PayloadModels = types.union(
    DishEditPayloadModel,
    DishCreatePayloadModel,
    ScheduleFoodEditPayloadModel,
    ScheduleFoodAddPayloadModel,
    ScheduleEventEditPayloadModel,
    ScheduleEventAddPayloadModel
);

export const ModalStore = types
    .model("ModalStore", {
        currentModal: types.maybe(types.enumeration('ModalType', Object.values(ModalType))),
        payload: types.maybe(PayloadModels),
    })
    .views(self => ({
        get isModalOpen() {
            return !!self.currentModal;
        },
    }))
    .actions(self => {
        const wizardModals: WizardModal[] = [
            ModalType.DISH_CREATE,
            ModalType.DISH_EDIT,
            ModalType.SCHEDULE_FOOD_ADD,
            ModalType.SCHEDULE_FOOD_EDIT,
            ModalType.SCHEDULE_EVENT_ADD,
            ModalType.SCHEDULE_EVENT_EDIT
        ];

        return {
            closeModal() {
                self.currentModal = undefined;
                self.payload = undefined;
            },

            openModal<T extends ModalType>(variant: T, payload?: GetPayload<T>): void {
                self.currentModal = variant;
                if (payload && wizardModals.includes(variant as WizardModal)) {
                    switch (variant) {
                        case ModalType.DISH_EDIT:
                            self.payload = DishEditPayloadModel.create(payload as SnapshotIn<typeof DishEditPayloadModel>);
                            break;
                        case ModalType.DISH_CREATE:
                            self.payload = DishCreatePayloadModel.create(payload as SnapshotIn<typeof DishCreatePayloadModel>);
                            break;
                        case ModalType.SCHEDULE_FOOD_EDIT:
                            self.payload = ScheduleFoodEditPayloadModel.create(payload as SnapshotIn<typeof ScheduleFoodEditPayloadModel>);
                            break;
                        case ModalType.SCHEDULE_FOOD_ADD:
                            self.payload = ScheduleFoodAddPayloadModel.create(payload as SnapshotIn<typeof ScheduleFoodAddPayloadModel>);
                            break;
                        case ModalType.SCHEDULE_EVENT_EDIT:
                            self.payload = ScheduleEventEditPayloadModel.create(payload as SnapshotIn<typeof ScheduleEventEditPayloadModel>);
                            break;
                        case ModalType.SCHEDULE_EVENT_ADD:
                            self.payload = ScheduleEventAddPayloadModel.create(payload as SnapshotIn<typeof ScheduleEventAddPayloadModel>);
                            break;
                        default:
                            self.payload = undefined;
                    }
                } else {
                    self.payload = undefined;
                }
            }
        };
    });

export type ModalStoreInstance = Instance<typeof ModalStore>;
