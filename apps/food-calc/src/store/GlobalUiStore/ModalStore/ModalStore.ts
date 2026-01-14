import { types, Instance } from "mobx-state-tree";
import {
    ModalType,
    ConfirmationModals
} from "./ModalContent";

export const ModalStore = types
    .model("ModalStore", {
        currentModal: types.maybe(types.enumeration('ModalType', Object.values(ModalType))),
    })
    .views(self => ({
        get isModalOpen() {
            return !!self.currentModal;
        },
    }))
    .actions(self => ({
        closeModal() {
            self.currentModal = undefined
        },

        openConfirmationModal(variant: ConfirmationModals) {
            self.currentModal = variant
        },

        openModal(variant: ModalType) {
            self.currentModal = variant
        }

    }));

export type ModalStoreInstance = Instance<typeof ModalStore>;
