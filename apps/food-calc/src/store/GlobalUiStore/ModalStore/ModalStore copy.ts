import { types, Instance } from "mobx-state-tree";
import {
    ModalType,
    ConfirmationModalData,
    CreateDishFromScheduleConfirmationModalData,
    CopyScheduleItemsToAnotherDayModalData,
    ConfirmationModalDataType,
    CreateDishFromScheduleModalDataType,
    CopyScheduleItemsToAnotherDayModalDataType
} from "./ModalContent";

const ConfirmationModal = types.model({
    type: types.literal(ModalType.CONFIRMATION),
    data: ConfirmationModalData,
});

const CreateDishFromScheduleModal = types.model({
    type: types.literal(ModalType.CREATE_DISH_FROM_SCHEDULE),
    data: CreateDishFromScheduleConfirmationModalData,
});

const CopyScheduleItemsToAnotherDayModal = types.model({
    type: types.literal(ModalType.COPY_SCHEDULE_ITEMS_TO_ANOTHER_DAY),
    data: CopyScheduleItemsToAnotherDayModalData,
});

export const ModalUnion = types.union(
    ConfirmationModal,
    CreateDishFromScheduleModal,
    CopyScheduleItemsToAnotherDayModal,
);

export const ModalState = types.model("ModalState", {
    modal: ModalUnion,
    isOpen: types.boolean,
}).actions(self => ({
    setIsOpen(isOpen: boolean) {
        self.isOpen = isOpen;
    },

})).views(self => ({
    get data() {
        return self.modal.data
    },
    get type() {
        return self.modal.type;
    },
}))

export type ModalStateInstance = Instance<typeof ModalState>;

export const ModalStore = types
    .model("ModalStore", {
        currentModal: types.maybe(ModalState),
    })
    .views(self => ({
        get isModalOpen() {
            return !!self.currentModal?.isOpen;
        },

        get activeModal() {
            return self.currentModal?.modal;
        },
    }))
    .actions(self => ({
        closeModal() {
            if (self.currentModal) {
                self.currentModal.setIsOpen(false);
            }
        },

        openConfirmationModal(data: ConfirmationModalDataType) {
            self.currentModal = ModalState.create({
                modal: {
                    type: ModalType.CONFIRMATION,
                    data
                },
                isOpen: true,
            });
        },

        openCreateDishFromScheduleModal() {
            self.currentModal = ModalState.create({
                modal: {
                    type: ModalType.CREATE_DISH_FROM_SCHEDULE,
                    data: {}
                },
                isOpen: true,
            });
        },

        openCopyScheduleItemsToAnotherDayModal() {
            self.currentModal = ModalState.create({
                modal: {
                    type: ModalType.COPY_SCHEDULE_ITEMS_TO_ANOTHER_DAY,
                    data: {}
                },
                isOpen: true,
            });
        },
    }));

export type ModalStoreInstance = Instance<typeof ModalStore>;
