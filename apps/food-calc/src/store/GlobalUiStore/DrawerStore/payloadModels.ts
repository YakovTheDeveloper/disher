import { types } from "mobx-state-tree";

// Individual drawer models
export const DateChooseDrawer = types.model('DateChooseDrawer', {
    type: types.literal('schedule.date'),
});

export const ProductAddDrawer = types.model('ProductAddDrawer', {
    type: types.literal('product.add'),
});

export const DishAddDrawer = types.model('DishAddDrawer', {
    type: types.literal('dish.add'),
});

export const ConfirmationRemoveDishesDrawer = types.model('ConfirmationRemoveDishesDrawer', {
    type: types.literal('confirmation.remove.dishes'),
});

export const ConfirmationRemoveScheduleFoodDrawer = types.model('ConfirmationRemoveScheduleFoodDrawer', {
    type: types.literal('confirmation.remove.schedule.food'),
});

export const ConfirmationRemoveScheduleEventsDrawer = types.model('ConfirmationRemoveScheduleEventsDrawer', {
    type: types.literal('confirmation.remove.schedule.events'),
});

export const ConfirmationRemoveDishItemsDrawer = types.model('ConfirmationRemoveDishItemsDrawer', {
    type: types.literal('confirmation.remove.dish.items'),
});

export const ConfirmationRemoveDailyNormDrawer = types.model('ConfirmationRemoveDailyNormDrawer', {
    type: types.literal('confirmation.remove.daily.norm'),
});

export const ConfirmationRemoveUserFoodDrawer = types.model('ConfirmationRemoveUserFoodDrawer', {
    type: types.literal('confirmation.remove.user.food'),
});

// Union of all drawer payload models
export const DrawerPayloadModel = types.union(
    DateChooseDrawer,
    ProductAddDrawer,
    DishAddDrawer,
    ConfirmationRemoveDishesDrawer,
    ConfirmationRemoveScheduleFoodDrawer,
    ConfirmationRemoveScheduleEventsDrawer,
    ConfirmationRemoveDishItemsDrawer,
    ConfirmationRemoveDailyNormDrawer,
    ConfirmationRemoveUserFoodDrawer,
);

// Drawer type strings
export type DrawerType =
    | 'schedule.date'
    | 'product.add'
    | 'dish.add'
    | 'confirmation.remove.dishes'
    | 'confirmation.remove.schedule.food'
    | 'confirmation.remove.schedule.events'
    | 'confirmation.remove.dish.items'
    | 'confirmation.remove.daily.norm'
    | 'confirmation.remove.user.food';

export type ConfirmationDrawers =
    | 'confirmation.remove.dishes'
    | 'confirmation.remove.schedule.food'
    | 'confirmation.remove.schedule.events'
    | 'confirmation.remove.dish.items'
    | 'confirmation.remove.daily.norm'
    | 'confirmation.remove.user.food';

// Unified exports object (types are exported separately)
export const Drawers = {
    models: {
        DateChoose: DateChooseDrawer,
        ProductAdd: ProductAddDrawer,
        DishAdd: DishAddDrawer,
        ConfirmationRemoveDishes: ConfirmationRemoveDishesDrawer,
        ConfirmationRemoveScheduleFood: ConfirmationRemoveScheduleFoodDrawer,
        ConfirmationRemoveScheduleEvents: ConfirmationRemoveScheduleEventsDrawer,
        ConfirmationRemoveDishItems: ConfirmationRemoveDishItemsDrawer,
        ConfirmationRemoveDailyNorm: ConfirmationRemoveDailyNormDrawer,
        ConfirmationRemoveUserFood: ConfirmationRemoveUserFoodDrawer,
    },
} as const;
