// TODO: Удалить этот файл после миграции на новую систему модалок
// Типы ModalType и GetPayload были удалены, так как ModalStore V1 удален
// Все методы модалок теперь должны использовать ModalStoreV2 или роуты

/**
 * Методы фасада для модалок (временно пустые - TODO)
 */
export interface ModalMethodMap {
    openFormDishAdd(payload?: any): void;
    openFormDishEdit(payload?: any): void;
    openFormScheduleFoodAdd(payload?: any): void;
    openFormScheduleFoodEdit(payload?: any): void;
    openFormScheduleEventAdd(payload?: any): void;
    openFormScheduleEventEdit(payload?: any): void;
    openCopyScheduleItemsToAnotherDay(): void;
    openCopyScheduleItemsToDish(): void;
    openCopyDishItemsToAnotherDish(): void;
    openCopyDishItemsToSchedule(): void;
    openCreateDishFromSchedule(): void;
    openSelect(): void;
    openPulsePhysicalActivity(): void;
    openSearchFood(payload?: any): void;
}
