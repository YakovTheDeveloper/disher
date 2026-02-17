import { types, SnapshotIn } from "mobx-state-tree";
import { ModalType } from "./ModalContent";

// ===== Payload Models =====

export const DishEditPayloadModel = types.model("DishEditPayload", {
    itemToEditId: types.string,
    defaultTab: types.maybe(types.enumeration<'content' | 'quantity'>('defaultTab', ['content', 'quantity'])),
});

export const DishCreatePayloadModel = types.model("DishCreatePayload", {
    defaultTab: types.maybe(types.enumeration<'content' | 'quantity'>('defaultTab', ['content', 'quantity'])),
});

export const ScheduleFoodEditPayloadModel = types.model("ScheduleFoodEditPayload", {
    itemToEditId: types.string,
    defaultTab: types.maybe(types.enumeration<'foodChange' | 'time' | 'quantity'>('defaultTab', ['foodChange', 'time', 'quantity'])),
});

export const ScheduleFoodAddPayloadModel = types.model("ScheduleFoodAddPayload", {
    defaultTab: types.maybe(types.enumeration<'foodChange' | 'time' | 'quantity'>('defaultTab', ['foodChange', 'time', 'quantity'])),
});

export const ScheduleEventEditPayloadModel = types.model("ScheduleEventEditPayload", {
    itemToEditId: types.string,
    defaultTab: types.maybe(types.string),
});

export const ScheduleEventAddPayloadModel = types.model("ScheduleEventAddPayload", {
    defaultTab: types.maybe(types.string),
});

export const SearchFoodPayloadModel = types.model("SearchFoodPayload", {
    productId: types.maybe(types.string),
    dishId: types.maybe(types.string),
});

// ===== Payload Types =====

export type DishEditPayload = SnapshotIn<typeof DishEditPayloadModel>;
export type DishCreatePayload = SnapshotIn<typeof DishCreatePayloadModel>;
export type ScheduleFoodEditPayload = SnapshotIn<typeof ScheduleFoodEditPayloadModel>;
export type ScheduleFoodAddPayload = SnapshotIn<typeof ScheduleFoodAddPayloadModel>;
export type ScheduleEventEditPayload = SnapshotIn<typeof ScheduleEventEditPayloadModel>;
export type ScheduleEventAddPayload = SnapshotIn<typeof ScheduleEventAddPayloadModel>;
export type SearchFoodPayload = SnapshotIn<typeof SearchFoodPayloadModel>;

// ===== Wizard Modal Type =====

export type WizardModal =
    | ModalType.DISH_CREATE
    | ModalType.DISH_EDIT
    | ModalType.SCHEDULE_FOOD_ADD
    | ModalType.SCHEDULE_FOOD_EDIT
    | ModalType.SCHEDULE_EVENT_ADD
    | ModalType.SCHEDULE_EVENT_EDIT
    | ModalType.SEARCH_FOOD;

// ===== Discriminated Union for All Payloads =====

type ModalPayloadDiscriminatedUnion =
    | { type: ModalType.DISH_EDIT; payload: DishEditPayload }
    | { type: ModalType.DISH_CREATE; payload: DishCreatePayload }
    | { type: ModalType.SCHEDULE_FOOD_EDIT; payload: ScheduleFoodEditPayload }
    | { type: ModalType.SCHEDULE_FOOD_ADD; payload: ScheduleFoodAddPayload }
    | { type: ModalType.SCHEDULE_EVENT_EDIT; payload: ScheduleEventEditPayload }
    | { type: ModalType.SCHEDULE_EVENT_ADD; payload: ScheduleEventAddPayload }
    | { type: ModalType.COPY_SCHEDULE_ITEMS_TO_ANOTHER_DAY; payload?: undefined }
    | { type: ModalType.COPY_SCHEDULE_ITEMS_TO_DISH; payload?: undefined }
    | { type: ModalType.COPY_DISH_ITEMS_TO_ANOTHER_DISH; payload?: undefined }
    | { type: ModalType.COPY_DISH_ITEMS_TO_SCHEDULE; payload?: undefined }
    | { type: ModalType.SELECT; payload?: undefined }
    | { type: ModalType.CREATE_DISH_FROM_SCHEDULE; payload?: undefined }
    | { type: ModalType.PULSE_PHYSICAL_ACTIVITY; payload?: undefined }
    | { type: ModalType.SEARCH_FOOD; payload: SearchFoodPayload };

// ===== GetPayload Helper Type =====

export type GetPayload<T extends ModalType> =
    Extract<ModalPayloadDiscriminatedUnion, { type: T }>['payload'];
