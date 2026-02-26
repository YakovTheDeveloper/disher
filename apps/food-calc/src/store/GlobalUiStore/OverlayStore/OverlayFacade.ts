import { DrawerTypesV2 } from "../DrawerStore/DrawerStore.v2.types";
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
    // TODO: make link to new route
    openModal<T extends string>(variant: T, payload?: any): void;
    closeModal(): void;
    isModalOpen: boolean;
}, drawerStore: {
    open<T extends Record<string, unknown>>(args: { type: string; payload?: T }): void;
    close(): void;
    isOpen: boolean;
}): OverlayFacade {
    return {
        // ===== Modal Methods (TODO: migrate to new modal system or routes) =====

        openFormDishAdd(payload?: any) {
            // TODO: make link to new route
        },

        openFormDishEdit(payload?: any) {
            // TODO: make link to new route
        },

        openFormScheduleFoodAdd(payload?: any) {
            // TODO: make link to new route
        },

        openFormScheduleFoodEdit(payload?: any) {
            // TODO: make link to new route
        },

        openFormScheduleEventAdd(payload?: any) {
            // TODO: make link to new route
        },

        openFormScheduleEventEdit(payload?: any) {
            // TODO: make link to new route
        },

        openCopyScheduleItemsToAnotherDay() {
            // TODO: move to new modal system
        },

        openCopyScheduleItemsToDish() {
            // TODO: move to new modal system
        },

        openCopyDishItemsToAnotherDish() {
            // TODO: move to new modal system
        },

        openCopyDishItemsToSchedule() {
            // TODO: move to new modal system
        },

        openCreateDishFromSchedule() {
            // TODO: move to new modal system
        },

        openSelect() {
            // TODO: move to new modal system
        },

        openPulsePhysicalActivity() {
            // TODO: move to new modal system
        },

        openSearchFood(payload?: any) {
            // TODO: move to new modal system
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
