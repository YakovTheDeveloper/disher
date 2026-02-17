import { ModalType } from "../ModalStore/ModalContent";
import { GetPayload } from "../ModalStore/ModalPayloads";

/**
 * Утилита для преобразования имени модалки в имя метода фасада.
 * DISH_EDIT -> openFormDishEdit
 * SEARCH_FOOD -> openSearchFood
 * и т.д.
 */
type ModalToMethodName<T extends ModalType> = T extends ModalType.DISH_EDIT
    ? "openFormDishEdit"
    : T extends ModalType.DISH_CREATE
    ? "openFormDishAdd"
    : T extends ModalType.SCHEDULE_FOOD_EDIT
    ? "openFormScheduleFoodEdit"
    : T extends ModalType.SCHEDULE_FOOD_ADD
    ? "openFormScheduleFoodAdd"
    : T extends ModalType.SCHEDULE_EVENT_EDIT
    ? "openFormScheduleEventEdit"
    : T extends ModalType.SCHEDULE_EVENT_ADD
    ? "openFormScheduleEventAdd"
    : T extends ModalType.COPY_SCHEDULE_ITEMS_TO_ANOTHER_DAY
    ? "openCopyScheduleItemsToAnotherDay"
    : T extends ModalType.COPY_SCHEDULE_ITEMS_TO_DISH
    ? "openCopyScheduleItemsToDish"
    : T extends ModalType.COPY_DISH_ITEMS_TO_ANOTHER_DISH
    ? "openCopyDishItemsToAnotherDish"
    : T extends ModalType.COPY_DISH_ITEMS_TO_SCHEDULE
    ? "openCopyDishItemsToSchedule"
    : T extends ModalType.CREATE_DISH_FROM_SCHEDULE
    ? "openCreateDishFromSchedule"
    : T extends ModalType.SELECT
    ? "openSelect"
    : T extends ModalType.PULSE_PHYSICAL_ACTIVITY
    ? "openPulsePhysicalActivity"
    : T extends ModalType.SEARCH_FOOD
    ? "openSearchFood"
    : never;

/**
 * Тип метода фасада для модалки с payload.
 * Все методы с payload принимают объект (опционально).
 */
type ModalMethodWithPayload<T extends ModalType> = (
    payload?: GetPayload<T>
) => void;

/**
 * Тип метода фасада для модалки без payload.
 */
type ModalMethodWithoutPayload = () => void;

/**
 * Проверяет, имеет ли модалка payload.
 */
type HasPayload<T extends ModalType> =
    undefined extends GetPayload<T> ? false : GetPayload<T> extends undefined ? false : true;

/**
 * Получает тип метода фасада для конкретной модалки.
 */
type GetModalMethod<T extends ModalType> =
    HasPayload<T> extends true ? ModalMethodWithPayload<T> : ModalMethodWithoutPayload;

/**
 * Маппит все ModalType к соответствующим методам фасада.
 * При добавлении новой модалки в ModalType — метод автоматически появится с правильным типом payload.
 */
export type ModalMethodMap = {
    [K in ModalType as ModalToMethodName<K>]: GetModalMethod<K>;
};
