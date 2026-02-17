import { ModalType } from "../ModalStore/ModalContent";
import { DrawerTypesV2 } from "../DrawerStore/DrawerStore.v2.types";
import { GetPayload } from "../ModalStore/ModalPayloads";
import { ModalMethodMap } from "./OverlayFacade.types";

/**
 * Типы для drawer методов (пока оставляем ручные, т.к. drawer не имеет строгой типизации payload).
 */
interface DrawerMethods {
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
}

/**
 * Общие методы для закрытия.
 */
interface CommonMethods {
    closeModal(): void;
    closeAll(): void;
}

/**
 * Фасад для управления модалками и дроверами.
 * Типы методов модалок автоматически выводятся из ModalType и GetPayload.
 * При добавлении новой модалки в ModalType — метод автоматически появится с правильными типами.
 */
export interface OverlayFacade extends ModalMethodMap, DrawerMethods, CommonMethods { }

export function createOverlayFacade(modalStore: {
    openModal<T extends ModalType>(variant: T, payload?: GetPayload<T>): void;
    closeModal(): void;
    isModalOpen: boolean;
}, drawerStore: {
    open<T extends Record<string, unknown>>(args: { type: string; payload?: T }): void;
    close(): void;
    isOpen: boolean;
}): OverlayFacade {
    return {
        // ===== Modal Methods =====

        openFormDishAdd(payload) {
            modalStore.openModal(ModalType.DISH_CREATE, payload);
        },

        openFormDishEdit(payload) {
            modalStore.openModal(ModalType.DISH_EDIT, payload);
        },

        openFormScheduleFoodAdd(payload) {
            modalStore.openModal(ModalType.SCHEDULE_FOOD_ADD, payload);
        },

        openFormScheduleFoodEdit(payload) {
            modalStore.openModal(ModalType.SCHEDULE_FOOD_EDIT, payload);
        },

        openFormScheduleEventAdd(payload) {
            modalStore.openModal(ModalType.SCHEDULE_EVENT_ADD, payload);
        },

        openFormScheduleEventEdit(payload) {
            modalStore.openModal(ModalType.SCHEDULE_EVENT_EDIT, payload);
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

        openSearchFood(payload) {
            modalStore.openModal(ModalType.SEARCH_FOOD, payload);
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
