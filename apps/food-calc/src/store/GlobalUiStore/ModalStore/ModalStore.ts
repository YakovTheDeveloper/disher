import { types, Instance, SnapshotIn } from "mobx-state-tree";
import {
    ModalType
} from "./ModalContent";

const WizardPayloadModel = types.model("WizardPayload", {
    itemToEditId: types.maybe(types.string),
    defaultTab: types.maybe(types.string),
});

export const ModalStore = types
    .model("ModalStore", {
        currentModal: types.maybe(types.enumeration('ModalType', Object.values(ModalType))),
        payload: types.maybe(WizardPayloadModel),
    })
    .views(self => ({
        get isModalOpen() {
            return !!self.currentModal;
        },
    }))
    .actions(self => {
        const wizardModals: ModalType[] = [
            ModalType.DISH_CREATE,
            ModalType.DISH_EDIT,
            ModalType.SCHEDULE_FOOD_ADD,
            ModalType.SCHEDULE_FOOD_EDIT,
            ModalType.SCHEDULE_EVENT_ADD,
            ModalType.SCHEDULE_EVENT_EDIT
        ];

        return {
            closeModal() {
                self.currentModal = undefined
                self.payload = undefined
            },

            openModal<T extends ModalType>(
                variant: T,
                ...args: T extends (
                    ModalType.DISH_EDIT |
                    ModalType.SCHEDULE_FOOD_EDIT |
                    ModalType.SCHEDULE_EVENT_EDIT
                ) ? [payload: SnapshotIn<typeof WizardPayloadModel> & { itemToEditId: string }] :

                    [payload?: never]
            ) {
                const [payload] = args;
                self.currentModal = variant;
                if (payload && wizardModals.includes(variant)) {
                    self.payload = WizardPayloadModel.create(payload);
                } else {
                    self.payload = undefined;
                }
            }
        };
    });

export type ModalStoreInstance = Instance<typeof ModalStore>;
export type WizardPayloadInstance = Instance<typeof WizardPayloadModel>;
