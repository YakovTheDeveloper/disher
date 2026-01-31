import { ModalType } from "../ModalStore/ModalContent";
import { DrawerTypesV2 } from "../DrawerStore/DrawerStore.v2.types";
import { WizardPayloadInstance } from "../ModalStore/ModalStore";

/**
 * Фасад для управления модалками и дроверами.
 * Предоставляет интуитивные методы без явного указания на тип (modal/drawer).
 */
export interface OverlayFacade {
    // ===== Modal Methods =====
    openFormFoodEdit(itemToEditId: string): void;
    openFormDishAdd(): void;
    openFormDishEdit(itemToEditId: string): void;
    openFormScheduleFoodAdd(): void;
    openFormScheduleFoodEdit(itemToEditId: string): void;
    openFormScheduleEventAdd(): void;
    openFormScheduleEventEdit(itemToEditId: string): void;
    openCopyScheduleItemsToAnotherDay(): void;
    openCopyScheduleItemsToDish(): void;
    openCopyDishItemsToAnotherDish(): void;
    openCopyDishItemsToSchedule(): void;
    openCreateDishFromSchedule(): void;
    openSelect(): void;
    openPulsePhysicalActivity(): void;
    closeModal(): void;

    // ===== Drawer Methods =====
    openDateChoose(): void;
    openProductAdd(): void;
    openDishAdd(): void;
    openDailyNormChoose(): void;
    openConfirmationRemoveDishes(title?: string, message?: string): void;
    openConfirmationRemoveDishItems(title?: string, message?: string): void;
    openConfirmationRemoveScheduleFood(title?: string, message?: string): void;
    openConfirmationRemoveScheduleEvents(title?: string, message?: string): void;
    openConfirmationRemoveDailyNorms(title?: string, message?: string): void;
    openConfirmationRemoveUserFood(title?: string, message?: string): void;
    closeDrawer(): void;

    // ===== Common Methods =====
    closeAll(): void;
}

export function createOverlayFacade(modalStore: {
    openModal<T extends ModalType>(
        variant: T,
        ...args: T extends (
            ModalType.DISH_EDIT |
            ModalType.SCHEDULE_FOOD_EDIT |
            ModalType.SCHEDULE_EVENT_EDIT
        ) ? [payload: { itemToEditId: string }] : [payload?: never]
    ): void;
    closeModal(): void;
    isModalOpen: boolean;
}, drawerStore: {
    open<T extends Record<string, unknown>>(args: { type: string; payload?: T }): void;
    close(): void;
    isOpen: boolean;
}): OverlayFacade {
    return {
        // ===== Modal Methods =====

        openFormFoodEdit(itemToEditId: string) {
            modalStore.openModal(ModalType.SCHEDULE_FOOD_EDIT, { itemToEditId });
        },

        openFormDishAdd() {
            modalStore.openModal(ModalType.DISH_CREATE);
        },

        openFormDishEdit(itemToEditId: string) {
            modalStore.openModal(ModalType.DISH_EDIT, { itemToEditId });
        },

        openFormScheduleFoodAdd() {
            modalStore.openModal(ModalType.SCHEDULE_FOOD_ADD);
        },

        openFormScheduleFoodEdit(itemToEditId: string) {
            modalStore.openModal(ModalType.SCHEDULE_FOOD_EDIT, { itemToEditId });
        },

        openFormScheduleEventAdd() {
            modalStore.openModal(ModalType.SCHEDULE_EVENT_ADD);
        },

        openFormScheduleEventEdit(itemToEditId: string) {
            modalStore.openModal(ModalType.SCHEDULE_EVENT_EDIT, { itemToEditId });
        },

        openCopyScheduleItemsToAnotherDay() {
            modalStore.openModal(ModalType.COPY_SCHEDULE_ITEMS_TO_ANOTHER_DAY);
        },

        openCopyScheduleItemsToDish() {
            modalStore.openModal(ModalType.COPY_SCHEDULE_ITEMS_TO_DISH);
        },

        openCopyDishItemsToAnotherDish() {
            modalStore.openModal(ModalType.COPY_DISH_ITEMS_TO_ANOTHER_DISH);
        },

        openCopyDishItemsToSchedule() {
            modalStore.openModal(ModalType.COPY_DISH_ITEMS_TO_SCHEDULE);
        },

        openCreateDishFromSchedule() {
            modalStore.openModal(ModalType.CREATE_DISH_FROM_SCHEDULE);
        },

        openSelect() {
            modalStore.openModal(ModalType.SELECT);
        },

        openPulsePhysicalActivity() {
            modalStore.openModal(ModalType.PULSE_PHYSICAL_ACTIVITY);
        },

        closeModal() {
            modalStore.closeModal();
        },

        // ===== Drawer Methods =====

        openDateChoose() {
            drawerStore.open({ type: DrawerTypesV2.Schedule.DateChoose });
        },

        openProductAdd() {
            drawerStore.open({ type: DrawerTypesV2.Product.Add });
        },

        openDishAdd() {
            drawerStore.open({ type: DrawerTypesV2.Dish.Add });
        },

        openDailyNormChoose() {
            drawerStore.open({ type: DrawerTypesV2.DailyNorm.Choose });
        },

        openConfirmationRemoveDishes(title?: string, message?: string) {
            drawerStore.open({
                type: DrawerTypesV2.Confirmation.RemoveDishes,
                payload: { title: title ?? '', message: message ?? '' },
            });
        },

        openConfirmationRemoveDishItems(title?: string, message?: string) {
            drawerStore.open({
                type: DrawerTypesV2.Confirmation.RemoveDishItems,
                payload: { title: title ?? '', message: message ?? '' },
            });
        },

        openConfirmationRemoveScheduleFood(title?: string, message?: string) {
            drawerStore.open({
                type: DrawerTypesV2.Confirmation.RemoveScheduleFood,
                payload: { title: title ?? '', message: message ?? '' },
            });
        },

        openConfirmationRemoveScheduleEvents(title?: string, message?: string) {
            drawerStore.open({
                type: DrawerTypesV2.Confirmation.RemoveScheduleEvents,
                payload: { title: title ?? '', message: message ?? '' },
            });
        },

        openConfirmationRemoveDailyNorms(title?: string, message?: string) {
            drawerStore.open({
                type: DrawerTypesV2.Confirmation.RemoveDailyNorms,
                payload: { title: title ?? '', message: message ?? '' },
            });
        },

        openConfirmationRemoveUserFood(title?: string, message?: string) {
            drawerStore.open({
                type: DrawerTypesV2.Confirmation.RemoveUserFood,
                payload: { title: title ?? '', message: message ?? '' },
            });
        },

        closeDrawer() {
            drawerStore.close();
        },

        // ===== Common Methods =====

        closeAll() {
            modalStore.closeModal();
            drawerStore.close();
        },
    };
}
