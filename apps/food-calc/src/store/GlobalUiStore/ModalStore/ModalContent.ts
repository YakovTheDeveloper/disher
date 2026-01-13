import { types, SnapshotIn } from "mobx-state-tree";

export enum ModalType {
    CONFIRMATION = 'confirmation',
    CREATE_DISH_FROM_SCHEDULE = 'CREATE_DISH_FROM_SCHEDULE',
    COPY_SCHEDULE_ITEMS_TO_ANOTHER_DAY = 'COPY_SCHEDULE_ITEMS_TO_ANOTHER_DAY',
    COPY_SCHEDULE_ITEMS_TO_DISH = 'COPY_SCHEDULE_ITEMS_TO_DISH',
    SELECT = 'select',
}

const actionType = types.optional(types.string, '')

export const ConfirmationModalData = types.model("ConfirmationModalData", {
    action: actionType,
}).actions(self => ({
    setAction(action: string) {
        self.action = action;
    },
}));

export const CreateDishFromScheduleConfirmationModalData = types.model("CreateDishFromScheduleConfirmationModalData", {
    action: actionType,

}).actions(self => ({
    setAction(action: string) {
        self.action = action;
    },
}));

export const CopyScheduleItemsToAnotherDayModalData = types.model("CopyScheduleItemsToAnotherDayModalData", {
    action: actionType,

}).actions(self => ({
    setAction(action: string) {
        self.action = action;
    },
}));

export type ConfirmationModalDataType = SnapshotIn<typeof ConfirmationModalData>;
export type CopyScheduleItemsToAnotherDayModalDataType = SnapshotIn<typeof CopyScheduleItemsToAnotherDayModalData>;
export type CreateDishFromScheduleModalDataType = SnapshotIn<typeof CreateDishFromScheduleConfirmationModalData>;
export const ModalData = types.union(ConfirmationModalData, CreateDishFromScheduleConfirmationModalData, CopyScheduleItemsToAnotherDayModalData);
